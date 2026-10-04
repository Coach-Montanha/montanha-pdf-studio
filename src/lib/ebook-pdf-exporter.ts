import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { EbookProject } from "../types/ebook";

export interface EbookPdfProgress {
  statusText: string;
  percent: number;
}

/**
 * Compila o E-book completo em formato clássico contínuo de alta fidelidade
 * e realiza o download direto do arquivo .PDF no computador do usuário.
 */
export async function downloadEbookAsDirectPdf(
  ebook: EbookProject,
  onProgress?: (progress: EbookPdfProgress) => void
): Promise<void> {
  onProgress?.({
    statusText: "Gerando documento clássico para compilação em PDF...",
    percent: 5,
  });

  // Criar container temporário isolado para renderização do PDF clássico
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // Largura padrão A4 (210mm a 96DPI)
  container.style.backgroundColor = "#FFFFFF";
  container.style.color = "#0F172A";
  container.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.zIndex = "-9999";
  container.className = "ebook-pdf-render-container";

  // Montagem do HTML clássico do e-book sem botões ou elementos de interface
  const chaptersHtml = ebook.chapters
    .map(
      (ch) => `
      <div class="pdf-page-section" style="padding: 40px 50px; background-color: #ffffff; color: #0f172a; page-break-after: always; min-h-[1000px];">
        <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid #f59e0b;">
          <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 1px;">
            CAPÍTULO ${ch.chapterNumber}
          </span>
          <h2 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 6px 0 4px 0; line-height: 1.2;">
            ${ch.title}
          </h2>
          ${ch.subtitle ? `<p style="font-size: 13px; font-weight: 600; color: #475569; margin: 0;">${ch.subtitle}</p>` : ""}
        </div>

        ${
          ch.introduction
            ? `<div style="background: #fffbebfb; border-left: 4px solid #f59e0b; padding: 14px 18px; font-style: italic; font-size: 13px; color: #334155; margin-bottom: 24px; border-radius: 6px;">
                "${ch.introduction}"
              </div>`
            : ""
        }

        <div style="font-size: 13px; line-height: 1.7; color: #1e293b;">
          ${ch.sections
            .map((sec) => {
              let secHtml = "";
              if (sec.title) {
                secHtml += `<h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 20px 0 10px 0;">${sec.title}</h3>`;
              }
              if (sec.type === "text") {
                secHtml += `<p style="margin-bottom: 14px; white-space: pre-line;">${sec.content}</p>`;
              } else if (sec.type === "callout") {
                secHtml += `
                  <div style="background: #fef3c7; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 14px 16px; margin: 16px 0; border-radius: 8px;">
                    ${sec.calloutTitle ? `<h4 style="font-size: 12px; font-weight: 800; color: #b45309; text-transform: uppercase; margin: 0 0 6px 0;">${sec.calloutTitle}</h4>` : ""}
                    <p style="margin: 0; font-size: 13px; color: #78350f;">${sec.content}</p>
                  </div>`;
              } else if (sec.type === "quote") {
                secHtml += `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 12px;">
                    <p style="font-size: 15px; font-style: italic; font-weight: 600; color: #b45309; margin: 0 0 8px 0;">"${sec.content}"</p>
                    ${sec.quoteAuthor ? `<span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">— ${sec.quoteAuthor}</span>` : ""}
                  </div>`;
              } else if (sec.type === "checklist") {
                secHtml += `
                  <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin: 16px 0; border-radius: 10px;">
                    <p style="font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase; margin: 0 0 10px 0;">✓ ${sec.content}</p>
                    ${
                      sec.checklistItems
                        ? `<ul style="list-style: none; padding: 0; margin: 0;">
                            ${sec.checklistItems.map((item) => `<li style="font-size: 12px; padding: 4px 0; color: #334155; border-bottom: 1px dashed #e2e8f0;">✔ ${item}</li>`).join("")}
                          </ul>`
                        : ""
                    }
                  </div>`;
              } else {
                secHtml += `<p style="margin-bottom: 14px; white-space: pre-line;">${sec.content}</p>`;
              }
              return secHtml;
            })
            .join("")}
        </div>

        ${
          ch.summaryTakeaways && ch.summaryTakeaways.length > 0
            ? `
          <div style="margin-top: 30px; background: #0f172a; color: #f8fafc; padding: 18px 22px; border-radius: 12px;">
            <h4 style="font-size: 12px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin: 0 0 10px 0;">
              📌 RESUMO EXECUTIVO (KEY TAKEAWAYS)
            </h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #e2e8f0;">
              ${ch.summaryTakeaways.map((tk) => `<li style="margin-bottom: 4px;">${tk}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }
      </div>`
    )
    .join("");

  container.innerHTML = `
    <!-- CAPA DO E-BOOK -->
    <div class="pdf-page-section" style="padding: 60px 50px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; page-break-after: always; min-height: 1000px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: inline-block; background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fbbf24; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px;">
          ${ebook.categoryTag || "E-BOOK EXCLUSIVO ECOSSISTEMA"}
        </div>
        <h1 style="font-size: 36px; font-weight: 900; color: #ffffff; text-transform: uppercase; line-height: 1.15; margin: 0 0 16px 0;">
          ${ebook.title}
        </h1>
        <p style="font-size: 16px; font-weight: 500; color: #cbd5e1; line-height: 1.5; margin: 0;">
          ${ebook.subtitle}
        </p>
      </div>

      <div style="border-top: 2px solid #334155; pt: 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 150px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block;">AUTOR(A)</span>
          <span style="font-size: 16px; font-weight: 800; color: #fbbf24;">${ebook.authorName}</span>
        </div>
        <div style="font-family: monospace; font-size: 11px; color: #94a3b8;">
          Ecossistema Montanha • Edição Digital
        </div>
      </div>
    </div>

    <!-- SUMÁRIO DA EDIÇÃO -->
    <div class="pdf-page-section" style="padding: 50px; background-color: #ffffff; color: #0f172a; page-break-after: always;">
      <h2 style="font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; margin-bottom: 20px;">
        SUMÁRIO DO E-BOOK
      </h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${ebook.chapters
          .map(
            (c) => `
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
            <div>
              <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: #d97706; margin-right: 8px;">CAPÍTULO ${c.chapterNumber}</span>
              <span style="font-size: 14px; font-weight: 700; color: #1e293b;">${c.title}</span>
            </div>
          </div>`
          )
          .join("")}
      </div>
    </div>

    <!-- CAPÍTULOS -->
    ${chaptersHtml}

    <!-- CONTRACAPA / AUTOR -->
    <div class="pdf-page-section" style="padding: 50px; background: #0f172a; color: #ffffff;">
      <h2 style="font-size: 20px; font-weight: 900; color: #fbbf24; text-transform: uppercase; margin-bottom: 12px;">
        SOBRE O AUTOR
      </h2>
      <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0;">${ebook.authorName}</h3>
      ${ebook.authorBio ? `<p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">${ebook.authorBio}</p>` : ""}

      ${
        ebook.callToActionText
          ? `
        <div style="margin-top: 40px; padding: 20px; background: #1e293b; border: 1px solid #f59e0b; border-radius: 12px; text-align: center;">
          <h4 style="font-size: 14px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin: 0 0 8px 0;">ECOSSISTEMA MONTANHA</h4>
          <p style="font-size: 12px; color: #e2e8f0; margin: 0 0 14px 0;">${ebook.callToActionText}</p>
          ${ebook.callToActionUrl ? `<div style="font-size: 12px; font-weight: 800; color: #fbbf24; text-decoration: underline;">${ebook.callToActionUrl}</div>` : ""}
        </div>`
          : ""
      }
    </div>
  `;

  document.body.appendChild(container);

  try {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".pdf-page-section"));
    const total = sections.length;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < total; i++) {
      const sec = sections[i];
      onProgress?.({
        statusText: `Renderizando página ${i + 1} de ${total}...`,
        percent: Math.round(((i + 1) / total) * 90),
      });

      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(sec, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    onProgress?.({
      statusText: "Finalizando arquivo PDF...",
      percent: 98,
    });

    const safeTitle = (ebook.title || "ebook").toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    pdf.save(`ebook-${safeTitle}.pdf`);

    onProgress?.({
      statusText: "Download concluído com sucesso!",
      percent: 100,
    });
  } finally {
    document.body.removeChild(container);
  }
}
