import pdf from 'html-pdf';

export function createPdf(content, options) {
  return new Promise((resolve, reject) => {

    pdf.create(content, options).toBuffer((error, buffer) => {
      if (!error) resolve(buffer); else reject(error);
    });

  });
}