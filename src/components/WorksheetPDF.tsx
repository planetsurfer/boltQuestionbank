import React, { useEffect, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  question_title: string;
  level: string;
  subject: string;
  marks: string;
  question_body: string;
  markscheme_body: string | null;
}

interface WorksheetPDFProps {
  questions: Question[];
  onClose: () => void;
}

type ContentType = 'questions' | 'answers';

export function WorksheetPDF({ questions, onClose }: WorksheetPDFProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [contentType, setContentType] = useState<ContentType>('questions');
  const [pdf, setPdf] = useState<jsPDF | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Process MathML to KaTeX
  const processMathML = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mathElements = doc.getElementsByTagName('math');

    Array.from(mathElements).forEach((mathElement) => {
      try {
        const mathML = mathElement.outerHTML;
        const tex = convertMathMLToTex(mathML);
        const katexHTML = katex.renderToString(tex, {
          throwOnError: false,
          output: 'html',
          displayMode: true,
        });
        
        const span = doc.createElement('span');
        span.className = 'math-rendered';
        span.innerHTML = katexHTML;
        mathElement.parentNode?.replaceChild(span, mathElement);
      } catch (error) {
        console.error('Error processing math:', error);
      }
    });

    return doc.body.innerHTML;
  };

  // Convert MathML to TeX
  const convertMathMLToTex = (mathML: string): string => {
    let tex = mathML
      .replace(/<math[^>]*>(.*?)<\/math>/g, '$1')
      .replace(/<mrow>/g, '{')
      .replace(/<\/mrow>/g, '}')
      .replace(/<msup>/g, '^{')
      .replace(/<\/msup>/g, '}')
      .replace(/<msub>/g, '_{')
      .replace(/<\/msub>/g, '}')
      .replace(/<mi>/g, '')
      .replace(/<\/mi>/g, '')
      .replace(/<mn>/g, '')
      .replace(/<\/mn>/g, '')
      .replace(/<mo>/g, '')
      .replace(/<\/mo>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    return tex;
  };

  const renderContent = (question: Question, index: number) => {
    const commonStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        font-family: 'Inter', sans-serif;
      }

      .content-wrapper {
        padding: 60px;
        background: white;
        width: 800px;
        margin: 0 auto;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header {
        margin-bottom: 36px;
        border-bottom: 2px solid #f3f4f6;
        padding-bottom: 24px;
      }

      .title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 12px;
      }

      .metadata {
        font-size: 15px;
        color: #6b7280;
      }

      .body {
        font-size: 16px;
        line-height: 2.2;
        color: #1f2937;
        letter-spacing: 0.01em;
      }

      .body p {
        margin: 2em 0;
      }

      .body > *:first-child {
        margin-top: 0;
      }

      .body > *:last-child {
        margin-bottom: 0;
      }

      .math-rendered {
        margin: 3em 0;
        display: block;
        padding: 1em 0;
      }

      /* Add spacing around inline math */
      .katex-display {
        margin: 2.5em 0 !important;
      }

      .katex {
        font-size: 1.2em;
      }

      /* Improve spacing around text nodes */
      .body > p + p {
        margin-top: 2.5em;
      }

      img {
        max-width: 100%;
        height: auto;
        margin: 2.5em 0;
      }

      ul, ol {
        margin: 2.5em 0;
        padding-left: 32px;
      }

      li {
        margin: 1.5em 0;
        line-height: 2.2;
      }

      /* Add spacing between list items with math */
      li .math-rendered {
        margin: 2em 0;
      }

      /* Add spacing between list items */
      li + li {
        margin-top: 2em;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 2.5em 0;
      }

      th, td {
        border: 1px solid #e5e7eb;
        padding: 16px;
        text-align: left;
        line-height: 2;
      }

      th {
        background-color: #f9fafb;
      }

      /* Add spacing for math elements inside table cells */
      td .math-rendered,
      th .math-rendered {
        margin: 1.5em 0;
      }

      /* Additional spacing for block elements */
      blockquote {
        margin: 2.5em 0;
        padding: 1.5em;
        background: #f9fafb;
        border-left: 4px solid #e5e7eb;
        line-height: 2.2;
      }

      /* Spacing for nested elements */
      .body > * > * {
        margin-top: 1.5em;
        margin-bottom: 1.5em;
      }

      /* Ensure proper spacing around headings */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 3em;
        margin-bottom: 1.5em;
        line-height: 1.6;
      }
    `;

    if (contentType === 'questions') {
      return (
        <div key={`question-${question.id}`}>
          <style>{commonStyles}</style>
          <div className="content-wrapper">
            <div className="header">
              <div className="title">Question {index + 1}</div>
              <div className="metadata">
                {question.level} | {question.subject} | {question.marks} marks
              </div>
            </div>
            <div 
              className="body"
              dangerouslySetInnerHTML={{ __html: processMathML(question.question_body) }}
            />
          </div>
        </div>
      );
    } else {
      return question.markscheme_body ? (
        <div key={`answer-${question.id}`}>
          <style>{commonStyles}</style>
          <div className="content-wrapper">
            <div className="header">
              <div className="title">Answer {index + 1}</div>
              <div className="metadata">
                {question.level} | {question.subject} | {question.marks} marks
              </div>
            </div>
            <div 
              className="body"
              dangerouslySetInnerHTML={{ __html: processMathML(question.markscheme_body)} }
            />
          </div>
        </div>
      ) : null;
    }
  };

  useEffect(() => {
    const generatePDF = async () => {
      if (!contentRef.current || currentQuestion >= questions.length) {
        if (contentType === 'questions') {
          setContentType('answers');
          setCurrentQuestion(0);
          return;
        } else {
          setIsLoading(false);
          if (pdf) {
            pdf.save('worksheet.pdf');
            toast.success('PDF generated successfully!');
            onClose();
          }
          return;
        }
      }

      try {
        // Wait for fonts and styles to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        const element = contentRef.current.children[0];
        if (!element) {
          throw new Error('Content element not found');
        }

        // Enhanced canvas capture settings
        const canvas = await html2canvas(element, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          windowHeight: element.scrollHeight,
          onclone: (clonedDoc) => {
            // Ensure styles are properly copied
            Array.from(document.styleSheets).forEach(styleSheet => {
              try {
                const cssRules = Array.from(styleSheet.cssRules || [])
                  .map(rule => rule.cssText)
                  .join('\n');
                
                const style = clonedDoc.createElement('style');
                style.textContent = cssRules;
                clonedDoc.head.appendChild(style);
              } catch (e) {
                console.warn('Could not copy stylesheet:', e);
              }
            });
          }
        });

        // Initialize PDF with better quality settings
        if (!pdf) {
          const newPdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4',
            compress: true,
            precision: 16
          });
          setPdf(newPdf);
        }

        // Add section title page
        if (currentQuestion === 0) {
          if (pdf) {
            if (contentType === 'answers') {
              pdf.addPage();
            }
            const title = contentType === 'questions' ? 'Questions' : 'Answers';
            pdf.setFontSize(24);
            pdf.setTextColor(17, 24, 39); // text-gray-900
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
            pdf.addPage();
          }
        }

        // Add content page
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (pdf && currentQuestion > 0) {
          pdf.addPage();
        }
        
        if (pdf) {
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 40;

          pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST');

          setCurrentQuestion(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error in PDF generation:', error);
        toast.error('Error generating PDF. Please try again.');
        onClose();
      }
    };

    generatePDF();
  }, [currentQuestion, questions, pdf, contentType]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-3 text-lg font-semibold mb-2">
            <Loader2 className="animate-spin" size={24} />
            Generating PDF
          </div>
          <div className="text-sm text-gray-600">
            Processing {contentType === 'questions' ? 'question' : 'answer'} {currentQuestion + 1} of {questions.length}
          </div>
        </div>

        <div ref={contentRef} className="bg-white rounded-lg shadow-lg">
          {currentQuestion < questions.length && renderContent(questions[currentQuestion], currentQuestion)}
        </div>
      </div>
    </div>
  );
}