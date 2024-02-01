import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

const PdfViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [rectangles, setRectangles] = useState([]);
  const [currentRectangle, setCurrentRectangle] = useState(null);

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setPdfFile(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCurrentRectangle({
      left: offsetX,
      top: offsetY,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (currentRectangle) {
      const { offsetX, offsetY } = e.nativeEvent;
      setCurrentRectangle((prevRect) => ({
        ...prevRect,
        width: offsetX - prevRect.left,
        height: offsetY - prevRect.top,
      }));
    }
  };

  const handleMouseUp = () => {
    if (currentRectangle) {
      setRectangles((prevRectangles) => [...prevRectangles, currentRectangle]);
      setCurrentRectangle(null);
    }
  };

  return (
    <div>
      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a PDF file here, or click to browse</p>
      </div>
      {pdfFile && (
        <div
          style={pdfViewerStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} />
          </Document>
          {rectangles.map((rect, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                border: "2px solid red",
                ...rect,
              }}
            />
          ))}
          {currentRectangle && (
            <div
              style={{
                position: "absolute",
                border: "2px solid blue",
                ...currentRectangle,
              }}
            />
          )}
          <p>
            Page {pageNumber} of {numPages}
          </p>
        </div>
      )}
    </div>
  );
};

const dropzoneStyle = {
  border: "2px dashed #ccc",
  borderRadius: "4px",
  padding: "20px",
  textAlign: "center",
  cursor: "pointer",
};

const pdfViewerStyle = {
  marginTop: "20px",
  position: "relative",
};

export default PdfViewer;
