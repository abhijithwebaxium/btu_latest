import { useEffect, useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/report')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const student = localStorage.getItem('current-student')
    if (!student) throw redirect({ to: '/login' })
  },
  component: CreditEvaluationReport,
})

const ASSIGNMENT_DATES: Record<string, string> = {
  'Dec-2024': '30th October 2024',
  'June-2025': '30th April 2025',
  'Dec-2025': '30th October 2025',
  'June-2026': '30th April 2026',
  'Dec-2026': '30th October 2026',
  'June-2027': '30th April 2027',
  'Dec-2027': '30th October 2027',
  'June-2028': '30th April 2028',
  'Dec-2028': '30th October 2028',
  'June-2029': '30th April 2029',
  'Dec-2029': '30th October 2029',
  'June-2030': '30th April 2030',
  'Dec-2030': '30th October 2030',
  'June-2031': '30th April 2031',
  'Dec-2031': '30th October 2031',
  'June-2032': '30th April 2032',
  'Dec-2032': '30th October 2032',
}

function formatCompletionYear(yyyyMM?: string): string {
  if (!yyyyMM) return ''
  const parts = yyyyMM.split('-')
  if (parts.length < 2) return 'Invalid Date'
  const [year, month] = parts
  const monthNum = parseInt(month, 10)
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return 'Invalid Date'
  const months = ['', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  return `${months[monthNum]}-${year}`
}

function printTable() {
  const table = document.getElementById('myTable')
  if (!table) return
  const newWindow = window.open()
  if (!newWindow) return
  newWindow.document.write('<html><head>')
  newWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">')
  newWindow.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/7.3.0/mdb.min.css" rel="stylesheet"/>')
  newWindow.document.write('<style>' +
    `.container { width: 100% !important; max-width: 100% !important; padding: 0 25px !important; margin: 0 !important; }
    .color { background-color: #f7caac !important; }
    .vertical-align { vertical-align: middle; }
    th { background-color: #f7caac !important; }
    #course-to-course th, #course-to-course tr { padding: 8px; }` +
    '</style>')
  newWindow.document.write('</head><body>')
  newWindow.document.write('<h1>CREDIT EVALUATION REPORT</h1>')
  newWindow.document.write(table.outerHTML)
  newWindow.document.write('</body></html>')
  newWindow.document.title = 'credit_evaluation_report'
  newWindow.document.close()
  setTimeout(() => { newWindow.print() }, 500)
}

declare global {
  interface Window {
    htmlDocx: { asBlob: (html: string) => Blob }
    saveAs: (blob: Blob, name: string) => void
  }
}

function convertToWord() {
  const table = document.getElementById('myTable')
  if (!table) return
  const tableClone = table.cloneNode(true) as HTMLElement
  const images = tableClone.getElementsByTagName('img')
  while (images.length > 0) { images[0].parentNode?.removeChild(images[0]) }
  const content = `<html><head><meta charset="utf-8">
    <style>
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid black; padding: 8px; text-align: center; }
      th { background-color: #f7caac; }
      #headContent { text-align: center; }
    </style></head><body>
    <div style="text-align:center;">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToFFNUCoazvSbbf1igCrkT8fL9KMixc2YVKQ&s" width="75" height="75" alt="University Logo" />
    </div>
    ${tableClone.outerHTML}</body></html>`
  const converted = window.htmlDocx.asBlob(content)
  window.saveAs(converted, 'credit_evaluation_report.docx')
}

function CreditEvaluationReport() {
  const navigate = useNavigate()
  const [student, setStudent] = useState<Record<string, any> | null>(null)

  // Inject Bootstrap CSS + CDN scripts for this page only
  useEffect(() => {
    const links: HTMLLinkElement[] = []
    const scripts: HTMLScriptElement[] = []

    const addLink = (href: string) => {
      const l = document.createElement('link')
      l.rel = 'stylesheet'; l.href = href
      document.head.appendChild(l); links.push(l)
    }
    const addScript = (src: string) => {
      const s = document.createElement('script')
      s.src = src; document.body.appendChild(s); scripts.push(s)
    }

    addLink('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css')
    addLink('https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/7.3.0/mdb.min.css')
    addScript('https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js')
    addScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js')

    return () => {
      links.forEach(l => document.head.removeChild(l))
      scripts.forEach(s => document.body.removeChild(s))
    }
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem('current-student')
    if (!raw) { navigate({ to: '/login' }); return }
    try { setStudent(JSON.parse(raw)) } catch { navigate({ to: '/login' }) }
  }, [navigate])

  if (!student) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <p>Loading report...</p>
      </div>
    )
  }

  const p = student.personalDetails || {}
  const a = student.academicDetails || {}
  const ev = (student.evaluation || {}) as Record<string, any>
  const subjects: Record<string, any>[] = ev.subjects || []

  // Compute all running totals (mirrors EJS logic exactly)
  let equalizedCredits = 0
  let totalCredits = 0
  let theoryCredits = 0
  let labCredits = 0
  let miniProjectCredits = 0
  let InternshipCredits = 0
  let majorProjectICredits = 0
  let majorProjectIICredits = 0
  let countsOfTheory = 0
  let countOfLab = 0

  for (const s of subjects) {
    if (s.equalized === 'equalized') {
      equalizedCredits += Number(s.credits) || 0
    }
    if (s.equalized === 'reappear' || s.equalized === 're-submission') {
      totalCredits += Number(s.credits) || 0
      if (s.examStatus === 'A.E.B.T.U.C') { theoryCredits += Number(s.credits) || 0; countsOfTheory++ }
      else if (s.examStatus === 'A.L.V') { labCredits += Number(s.credits) || 0; countOfLab++ }
      else if (s.examStatus === 'M.I.P.R.S') { miniProjectCredits += Number(s.credits) || 0 }
      else if (s.examStatus === 'M.A.P.R.S.I') { majorProjectICredits += Number(s.credits) || 0 }
      else if (s.examStatus === 'M.A.P.R.S.II') { majorProjectIICredits += Number(s.credits) || 0 }
      else if (s.examStatus === 'I.R.S') { InternshipCredits += Number(s.credits) || 0 }
    }
  }

  const displayTotalCredits = ev.totalCredits ?? equalizedCredits
  const equalizedSubjects = subjects.filter(s => s.equalized === 'equalized')
  const reappearSubjects = subjects.filter(s => s.equalized === 'reappear' || s.equalized === 're-submission')
  const completionFormatted = formatCompletionYear(a.courseCompletionYear)
  const backlogs = (Number(a.numberOfBacklogsAtParentUniversity?.theory) || 0) +
    (Number(a.numberOfBacklogsAtParentUniversity?.lab) || 0)

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`
        .color { background-color: #f7caac !important; }
        .vertical-align { vertical-align: middle; }
      `}</style>

      {/* Action buttons */}
      <div className="d-flex justify-content-end mb-4 mx-5 gap-3" style={{ paddingTop: '16px' }}>
        <button onClick={() => navigate({ to: '/' })} className="btn btn-secondary">
          ← Back
        </button>
        <button onClick={printTable} className="btn btn-primary">
          Save as PDF
        </button>
        <button onClick={convertToWord} className="btn btn-primary">
          Save as Word
        </button>
      </div>

      {/* Report content — id="myTable" matches original exactly */}
      <div
        className="container d-flex flex-column justify-content-center"
        style={{ minHeight: '100vh' }}
        id="myTable"
      >
        <div className="wrapper text-center">

          {/* University Header */}
          <div className="d-flex justify-content-center gap-1">
            <img src="/image/btu_logo.png" style={{ height: 100, width: 115 }} alt="University Logo" />
            <div className="text-center">
              <h2 className="mt-3 text-uppercase">Bir Tikendrajit University</h2>
              <h6 className="mb-0">
                (A State Private University established Under Section 2(f) of UGC Act, 1956)
              </h6>
              <h6 className="mb-0">Campus: Manipur, India</h6>
            </div>
          </div>

          {/* Section 1 — Personal Details */}
          <div id="headContent">
            <h4 className="mt-5">CREDIT EVALUATION REPORT</h4>
            <table className="table">
              <tbody>
                <tr>
                  <th className="border p-2 col w-50 color">STUDENT NAME</th>
                  <td className="border p-2 col w-50">{p.name}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">FATHER'S NAME</th>
                  <td className="border p-2 col">{p.fatherName}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">MOTHER'S NAME</th>
                  <td className="border p-2 col">{p.motherName}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">DATE OF BIRTH</th>
                  <td className="border p-2 col">{p.dateOfBirth}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">MOBILE NUMBER</th>
                  <td className="border p-2 col">{p.mobileNumber}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">VALID EMAIL ID</th>
                  <td className="border p-2 col">{p.email}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">GENDER</th>
                  <td className="border p-2 col">{p.gender}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color">NATIONALITY</th>
                  <td className="border p-2 col">{p.nationality}</td>
                </tr>
                <tr>
                  <th className="border p-2 col color vertical-align">CURRENT ADDRESS</th>
                  <td className="border p-2 col vertical-align">{p.permanentAddress}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2 — Academic Details (page break before) */}
          <p style={{ pageBreakBefore: 'always', marginTop: 20 }}>
            2. Details of the Programme of Study at B.T University to which you wish to apply for Credit Transfer
            (student mandatory section)
          </p>
          <table className="table">
            <tbody>
              <tr>
                <td className="border p-2 col w-50 color">NAME OF PROGRAM AND BRANCH</td>
                <td className="border p-2 col w-50">
                  {a.nameOfPrograme} {a.branch ? `- ${a.branch}` : ''}
                </td>
              </tr>
              <tr>
                <td className="border p-2 col color">NAME OF PREVIOUS /PARENT UNIVERSITY</td>
                <td className="border p-2 col">{a.parentUniversity}</td>
              </tr>
              <tr>
                <td className="border p-2 col color">PERIOD OF STUDY AT PREVIOUS /PARENT UNIVERSITY</td>
                <td className="border p-2 col">{a.periodOfStudyAtParentUniversity}</td>
              </tr>
              <tr>
                <td className="border p-2 col color">LAST ATTENDED EXAM AT PREVIOUS /PARENT UNIVERSITY</td>
                <td className="border p-2 col">{a.lastExamAtParentUniversity}</td>
              </tr>
              <tr>
                <td className="border p-2 col color">NO OF SEMESTER COMPLETED AT PREVIOUS /PARENT UNIVERSITY</td>
                <td className="border p-2 col">{a.semesterCompletedAtParentUniversity}</td>
              </tr>
              <tr>
                <td className="border p-2 col color">NO OF BACKLOGS AT PREVIOUS /PARENT UNIVERSITY</td>
                <td className="border p-2 col">{backlogs}</td>
              </tr>
            </tbody>
          </table>

          {/* Transfer Equivalency Database Section */}
          <h4 className="mt-5">TRANSFER EQUIVALENCY DATABASE SECTION</h4>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th className="color">SEMESTER</th>
                <th className="color">COURSE CODE</th>
                <th className="color">COURSE TITLE AT BTU</th>
                <th className="color">PREVIOUS UNIVERSITY COURSE CODE</th>
                <th className="color">PREVIOUS UNIVERSITY EQUALIZED COURSE</th>
                <th className="color">CREDIT</th>
                <th className="color">GRADE</th>
                <th className="color">MO</th>
                <th className="color">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {equalizedSubjects.map((s, i) => (
                <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.semester}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.btuSubjectCode || s.subjectCode}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.btuSubjectTitle || s.subjectTitle}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.btuSubjectCode || s.subjectCode}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.equalizedSubject}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.credits}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.grade}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.mark}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>
                    {Number(s.mark) >= 40 ? 'Pass' : 'Fail'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Equalized Credit Evaluation Summary */}
          <h4 className="mt-4">STUDENT EQUALIZED CREDIT EVALUATION REPORT</h4>
          <table className="table mt-3">
            <tbody>
              <tr>
                <td className="border p-2 col w-50 color">Total equalized course credit</td>
                <td className="border p-2 col w-50">{displayTotalCredits}</td>
              </tr>
            </tbody>
          </table>

          {/* Student Credit Evaluation (Reappear subjects) */}
          <h4 className="mt-4">STUDENT CREDIT EVALUATION REPORT</h4>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th className="color">SEMESTER</th>
                <th className="color">COURSE CODE</th>
                <th className="color">COURSE TITLE AT BTU</th>
                <th className="color">CREDIT</th>
                <th className="color">EXAM BATCH</th>
                <th className="color">SEMESTER SET</th>
                <th className="color">LAST DATE ASSIGNMENT SUBMISSION</th>
              </tr>
            </thead>
            <tbody>
              {reappearSubjects.map((s, i) => (
                <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.semester}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.btuSubjectCode || s.subjectCode}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>
                    <div className="d-flex justify-content-center gap-2">
                      {s.btuSubjectTitle || s.subjectTitle}
                    </div>
                  </td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.credits}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.examBatch}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{s.semesterSet}</td>
                  <td style={{ pageBreakInside: 'avoid' }}>{ASSIGNMENT_DATES[s.examBatch] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Appear Exam Credit Evaluation (complex multi-rowspan table) */}
          <h4 className="mt-4">STUDENT APPEAREXAM CREDIT EVALUATION REPORT</h4>
          <div>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th rowSpan={3} className="color vertical-align">
                    Equalize credits Transfer to <strong>BTU</strong>
                  </th>
                  <th colSpan={6} className="color vertical-align">
                    Credit requirement for Graduation completion as per{' '}
                    <strong>BTU syllabus Syllabus credits - 166 Credits</strong>
                  </th>
                  <th colSpan={4} className="color vertical-align">
                    Total Credits
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="color vertical-align">Theory</th>
                  <th colSpan={2} className="color vertical-align">Lab</th>
                  <th colSpan={3} className="color vertical-align">Project</th>
                  <th colSpan={2} rowSpan={2} className="color vertical-align">
                    Total Credit Requirement as per BTU syllabus
                  </th>
                  <th colSpan={2} rowSpan={2} className="color vertical-align">
                    Additional Credit Requirement as per BTU Regulation
                  </th>
                </tr>
                <tr>
                  <th colSpan={1} className="color vertical-align">Total No of Theory paper</th>
                  <th colSpan={1} className="color vertical-align">Credit</th>
                  <th colSpan={1} className="color vertical-align">Total No of Lab</th>
                  <th colSpan={1} className="color vertical-align">Credit</th>
                  <th colSpan={1} className="color vertical-align">Activity</th>
                  <th colSpan={1} className="color vertical-align">Credit</th>
                  <th colSpan={1} className="color vertical-align">Practical Hour</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={4} className="vertical-align">{equalizedCredits} CREDITS</td>
                  <td rowSpan={4} className="vertical-align">{countsOfTheory} THEORY</td>
                  <td rowSpan={4} className="vertical-align">{theoryCredits} CREDITS</td>
                  <td rowSpan={4} className="vertical-align">{countOfLab} LAB</td>
                  <td rowSpan={4} className="vertical-align">{labCredits} CREDITS</td>
                  <td className="vertical-align">Mini Project</td>
                  <td className="vertical-align">{miniProjectCredits}</td>
                  <td className="vertical-align" style={{ minWidth: 145 }}>2 × 30 = 60 LH</td>
                  <td rowSpan={4} colSpan={2} className="vertical-align" style={{ borderTop: 0 }}>
                    {totalCredits} CREDITS
                  </td>
                  <td rowSpan={4} colSpan={2} className="vertical-align" style={{ borderTop: 0 }}>
                    {totalCredits >= 83 ? 0 : 83 - totalCredits} CREDITS
                  </td>
                </tr>
                <tr>
                  <td className="vertical-align">Internship</td>
                  <td className="vertical-align">{InternshipCredits}</td>
                  <td className="vertical-align">4 × 40 =160LH</td>
                </tr>
                <tr>
                  <td className="vertical-align">Major Project I</td>
                  <td className="vertical-align">{majorProjectICredits}</td>
                  <td className="vertical-align">1 × 30 =30 LH</td>
                </tr>
                <tr>
                  <td className="vertical-align">Major Project II</td>
                  <td className="vertical-align">{majorProjectIICredits}</td>
                  <td className="vertical-align">8 × 30=240 LH</td>
                </tr>
                {a.courseCompletionYear && (
                  <tr>
                    <th colSpan={6} className="vertical-align">Final Exam Completion</th>
                    <th colSpan={6} className="vertical-align">{completionFormatted}</th>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rules & Regulations */}
          <h3 className="color">Rules &amp; Regulations</h3>
          <div
            className="container mt-4"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'start' }}
          >
            <p>
              Full credit transfer would be allowed in the syllabus and methodology are similar in pattern that
              governing the student under prior studied university.
            </p>
            <p>
              A student is required to complete the prescribed courses as per programme structure of the respective
              Programme under new Enrolment.
            </p>
            <p>
              Students are required to spend at least a minimum of one Year duration to complete the left over
              courses in the new Enrolment Number
            </p>
            <p>Only courses with a grade of E- or better will transfer</p>
            <p>
              Credit transfer will be permissible in the case of students coming from institutions established by
              an Act of Parliament or by an Act of State Legislature; or an institution Deemed to be University,
              or an Institution of National Importance
            </p>
            <p>
              Self-Attested copies of detailed Grade Card of the courses qualified in qualifying examination, from
              the accredited University/Institution and opted for Credit Transfer in the Bir Tikendrajit University
              Graduate Programme
            </p>
          </div>

          {/* To apply for Credit Transfer */}
          <h3 className="color">To apply for Credit Transfer:</h3>
          <div
            className="container"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'start' }}
          >
            <p>
              Gather all documentation - all certificates must be authentic or certified copies and presented for
              sighting.
            </p>
            <p>Complete an application form.</p>
            <p>Submit the application and documentation to access or for assessment</p>
          </div>

          {/* Student Declaration */}
          <h3 className="color" style={{ textAlign: 'start' }}>STUDENT DECLARATION</h3>
          <p style={{ textAlign: 'start' }}>
            I declare that information submitted on and this form is complete and accurate in all aspects. I
            acknowledge that the provision of incorrect information may result in the Rejection of preliminary
            application form for credit transfer by Bir Tikendrajit University Student's Signature
            ____________________________________________ Date ____
          </p>

          {/* University Section */}
          <h4 className="color text-start">(UNIVERSITY SECTION ONLY)</h4>
          {ev.evaluator?.name && (
            <p className="text-start">
              {ev.evaluator.name} : UNIVERSITY CREDIT TRANSFER EXPERT COMMITTEE
            </p>
          )}
          <p className="text-center" style={{ fontSize: 14 }}>
            ** The University Authorities reserve all the rights to make any additions/ deletions or Changes/
            modifications to this Application form data and updation as deemed necessary
          </p>

        </div>

        {/* Signature block if validated */}
        {student.CERValidation?.status && (
          <div className="d-flex justify-content-end align-items-center mt-5">
            <div id="signature">
              <p>Name:- {student.CERValidation.validatedBy?.name}</p>
              <p>Department:- {student.CERValidation.validatedBy?.department?.type}</p>
              {student.CERValidation.validatedBy?.signature && (
                <div>
                  <img
                    src={student.CERValidation.validatedBy.signature}
                    alt="signature"
                    style={{ width: 200, height: 100 }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
