function escapePdfText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLines(text, maxChars = 78) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);
  return lines;
}

function buildPdfBlob(title, bodyLines) {
  const allLines = [title, '', ...bodyLines].flatMap((line) => wrapLines(line));
  const safeLines = allLines.slice(0, 44);
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...safeLines.map((line, index) => `${index === 0 ? '' : '0 -16 Td'} (${escapePdfText(line)}) Tj`).filter(Boolean),
    'ET'
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadCoursePdf(course) {
  const sections = [
    `Category: ${course.category || 'General'}`,
    `Instructor: ${course.instructor_name || 'Unknown'}`,
    course.description || 'No course description available.',
    ...(course.modules || []).flatMap((moduleItem, moduleIndex) => [
      '',
      `Module ${moduleIndex + 1}: ${moduleItem.module_name}`,
      ...(moduleItem.lessons || []).map((lesson, lessonIndex) => `  Lesson ${lessonIndex + 1}: ${lesson.lesson_name}`)
    ])
  ];

  triggerDownload(`${course.title || 'course'}-overview.pdf`, buildPdfBlob(course.title || 'Course Overview', sections));
}

export function downloadModulePdf(course, moduleItem) {
  const sections = [
    `Course: ${course?.title || 'Course'}`,
    `Module: ${moduleItem?.module_name || 'Module'}`,
    ...(moduleItem?.lessons || []).flatMap((lesson, index) => [
      '',
      `Lesson ${index + 1}: ${lesson.lesson_name}`,
      lesson.content || 'No detailed content available.'
    ])
  ];

  triggerDownload(`${moduleItem?.module_name || 'module'}-resources.pdf`, buildPdfBlob(moduleItem?.module_name || 'Module Resources', sections));
}

export function downloadCertificatePdf({ learnerName, courseTitle, completedDate }) {
  const safeName = escapeHtml(learnerName || 'Learner');
  const safeCourse = escapeHtml(courseTitle || 'Course');
  const safeDate = escapeHtml(completedDate || '');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Certificate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Source+Sans+3:wght@400;600;700&display=swap');
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            font-family: 'Source Sans 3', sans-serif;
            background: #f3f7fb;
            color: #1f2937;
          }
          .certificate-sheet {
            position: relative;
            padding: 60px;
            border-radius: 28px;
            background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92));
            border: 1px solid rgba(37, 99, 235, 0.2);
            box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
            overflow: hidden;
          }
          .certificate-sheet::before {
            content: '';
            position: absolute;
            inset: 16px;
            border-radius: 22px;
            border: 1px solid rgba(15, 23, 42, 0.08);
            background-image:
              radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 40%),
              radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.12), transparent 40%);
          }
          .certificate-sheet::after {
            content: '';
            position: absolute;
            top: 18px;
            left: 50%;
            width: 260px;
            height: 80px;
            transform: translateX(-50%);
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='80' viewBox='0 0 260 80'%3E%3Cpath d='M10 40c32-32 64-32 96 0s64 32 96 0' stroke='%23c7d2fe' stroke-width='2' fill='none' opacity='0.7'/%3E%3Ccircle cx='130' cy='40' r='4' fill='%2394a3b8' opacity='0.6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-size: contain;
            opacity: 0.7;
          }
          .certificate-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
            margin-bottom: 32px;
          }
          .certificate-brand {
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-size: 11px;
            color: #475569;
          }
          .certificate-emblem {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(20, 184, 166, 0.18));
            border: 1px solid rgba(37, 99, 235, 0.3);
            color: #1d4ed8;
            font-weight: 700;
          }
          .certificate-title {
            font-family: 'Cinzel', serif;
            font-size: 36px;
            text-align: center;
            margin: 0 0 8px;
            position: relative;
            z-index: 1;
          }
          .certificate-subtitle {
            text-align: center;
            color: #64748b;
            margin: 0 0 24px;
            position: relative;
            z-index: 1;
          }
          .certificate-name {
            font-family: 'Great Vibes', cursive;
            font-size: 48px;
            text-align: center;
            color: #1d4ed8;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
          }
          .certificate-body {
            text-align: center;
            color: #475569;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .certificate-course {
            text-align: center;
            font-weight: 700;
            font-size: 22px;
            margin-bottom: 32px;
            position: relative;
            z-index: 1;
          }
          .certificate-footer {
            display: flex;
            justify-content: space-between;
            gap: 32px;
            align-items: flex-end;
            position: relative;
            z-index: 1;
          }
          .certificate-date,
          .certificate-signature-block {
            display: grid;
            gap: 6px;
            font-size: 13px;
            color: #475569;
          }
          .certificate-date strong {
            font-size: 16px;
            color: #0f172a;
          }
          .certificate-signature {
            font-family: 'Great Vibes', cursive;
            font-size: 28px;
            color: #1e293b;
          }
          .certificate-signature-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .certificate-sheet { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-sheet">
          <div class="certificate-header">
            <span class="certificate-brand">Sigverse Academy</span>
            <div class="certificate-emblem">SV</div>
          </div>
          <h2 class="certificate-title">Certificate of Completion</h2>
          <p class="certificate-subtitle">This certificate is proudly presented to</p>
          <div class="certificate-name">${safeName}</div>
          <p class="certificate-body">for successfully completing the course</p>
          <div class="certificate-course">${safeCourse}</div>
          <div class="certificate-footer">
            <div class="certificate-date">
              <span>Date</span>
              <strong>${safeDate}</strong>
            </div>
            <div class="certificate-signature-block">
              <span class="certificate-signature">Sigverse Learning</span>
              <span class="certificate-signature-label">Director of Learning</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  printWindow.onload = () => {
    setTimeout(triggerPrint, 300);
  };
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
