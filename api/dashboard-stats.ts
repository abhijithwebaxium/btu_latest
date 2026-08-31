import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/lib/db.js'
import { Student } from '../src/models/Student.js'
import { SupportThread } from '../src/models/SupportThread.js'
import { Assignment } from '../src/models/Assignment.js'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PIE_COLORS = ['#ed143d', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const adminKey = req.headers['x-admin-key']
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  try {
    await connectToDatabase()

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // Department distribution: group students by their course name
    const [
      deptAgg,
      totalStudents,
      pendingVerifications,
      feeIncomplete,
      monthlyStudents,
      monthlyTickets,
      monthlyAssignments,
      ticketSummary,
    ] = await Promise.all([
        Student.aggregate([
          {
            $lookup: {
              from: 'courses',
              localField: 'course',
              foreignField: '_id',
              as: 'courseInfo',
            },
          },
          { $unwind: { path: '$courseInfo', preserveNullAndEmpty: true } },
          {
            $group: {
              _id: {
                $ifNull: ['$courseInfo.name', '$academicDetails.nameOfPrograme', 'Unassigned'],
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),

        Student.countDocuments(),

        // Students awaiting profile verification by staff
        Student.countDocuments({ verificationPending: true }),

        // Students whose fee payment is not yet marked complete
        Student.countDocuments({ isFeeCompleted: { $ne: true } }),

        Student.aggregate([
          { $match: { importedAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { month: { $month: '$importedAt' }, year: { $year: '$importedAt' } },
              count: { $sum: 1 },
            },
          },
        ]),

        SupportThread.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
        ]),

        Assignment.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
        ]),

        Promise.all([
          SupportThread.countDocuments({ status: 'open' }),
          SupportThread.countDocuments({ status: 'in_progress' }),
          SupportThread.countDocuments({ status: 'resolved' }),
          SupportThread.countDocuments({ priority: 'urgent', status: { $nin: ['resolved', 'closed'] } }),
        ]),
      ])

    // Build department distribution pie data
    const departmentDistribution = deptAgg.map((d, i) => ({
      name: d._id || 'Unassigned',
      value: totalStudents > 0 ? Math.round((d.count / totalStudents) * 100) : 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))

    // Build monthly data for last 6 months
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth() + 1
      const year = d.getFullYear()
      const stuEntry = monthlyStudents.find(e => e._id.month === month && e._id.year === year)
      const tckEntry = monthlyTickets.find(e => e._id.month === month && e._id.year === year)
      const asnEntry = monthlyAssignments.find(e => e._id.month === month && e._id.year === year)
      monthlyData.push({
        month: MONTH_NAMES[month - 1],
        year,
        enrollments: stuEntry?.count ?? 0,
        assignments: asnEntry?.count ?? 0,
        tickets: tckEntry?.count ?? 0,
      })
    }

    const [openTickets, inProgressTickets, resolvedTickets, urgentTickets] = ticketSummary

    return res.status(200).json({
      success: true,
      totalStudents,
      pendingVerifications,
      feeIncomplete,
      departmentDistribution,
      monthlyData,
      ticketSummary: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        urgent: urgentTickets,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message || 'Server error' })
  }
}
