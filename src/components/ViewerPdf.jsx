import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PdfReader = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedText, setSelectedText] = useState("");

  const onFileChange = (e) => {
    const file = e.target.files[0];
    setPdfFile(file);
    setPageNumber(1);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    setSelectedText(selectedText);
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={onFileChange} />
      {pdfFile && (
        <div>
          <Document
            file={pdfFile}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            <Page pageNumber={pageNumber} onClick={handleTextSelection} />
          </Document>
          <p>
            Page {pageNumber} of {numPages}
          </p>
          <div>
            <p>Selected Text:</p>
            <div
              style={{
                border: "2px solid red",
                borderRadius: "4px",
                background: "rgba(255, 0, 0, 0.3)",
                padding: "10px",
              }}
            >
              {selectedText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfReader;
