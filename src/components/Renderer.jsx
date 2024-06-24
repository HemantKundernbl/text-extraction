import React, { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

const PdfViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [rectangles, setRectangles] = useState([]);
  const [currentRectangle, setCurrentRectangle] = useState(null);
  const [allRectangles, setAllRectangles] = useState([]);
  const drawingAreaRef = useRef(null);
  const pageRef = useRef(null);
  const originalWidthRef = useRef(0);
  const originalHeightRef = useRef(0);
  const scaleRef = useRef(1);

  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setPdfFile(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onPageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    originalWidthRef.current = viewport.width;
    originalHeightRef.current = viewport.height;
    scaleRef.current = pageRef.current.offsetWidth / viewport.width;
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getMousePosition(e);
    setCurrentRectangle({
      left: offsetX,
      top: offsetY,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (currentRectangle) {
      const { offsetX, offsetY } = getMousePosition(e);
      setCurrentRectangle((prevRect) => ({
        ...prevRect,
        width: offsetX - prevRect.left,
        height: offsetY - prevRect.top,
        right: offsetX,
        bottom: offsetY,
      }));
    }
  };

  const handleMouseUp = () => {
    if (currentRectangle) {
      const { left, top, right, bottom } = currentRectangle;

      // Transforming coordinates to match PDF coordinate system
      const rectangleCoordinates = {
        left: Math.min(left, right) / scaleRef.current,
        top:
          originalHeightRef.current - Math.max(top, bottom) / scaleRef.current,
        right: Math.max(left, right) / scaleRef.current,
        bottom:
          originalHeightRef.current - Math.min(top, bottom) / scaleRef.current,
      };

      // Add the rectangle coordinates to the allRectangles state
      setAllRectangles((prevRectangles) => [
        ...prevRectangles,
        rectangleCoordinates,
      ]);

      // Add the rectangle to the rectangles state for rendering
      setRectangles((prevRectangles) => [...prevRectangles, currentRectangle]);

      setCurrentRectangle(null);
    }
  };

  const handleSubmit = () => {
    const apiUrl =
      "https://crm.nablasol.net/custom/service/v4_1_custom/nblDmsPdfExtract.php";

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("coordinates", JSON.stringify(allRectangles));

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    fetch(apiUrl, requestOptions)
      .then((response) => {
        if (response.ok) {
          alert("Data sent successfully");
          return response.json();
        } else {
          throw new Error("Failed to send data to the API");
        }
      })
      .then((data) => {
        console.log("Response from API:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const getMousePosition = (e) => {
    const rect = drawingAreaRef.current.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  useEffect(() => {
    const handleMouseUpOutside = () => {
      if (currentRectangle) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleMouseUpOutside);

    return () => {
      document.removeEventListener("mouseup", handleMouseUpOutside);
    };
  }, [currentRectangle, handleMouseUp]);

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
          ref={drawingAreaRef}
        >
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={pageNumber}
              className="pdf-page"
              renderAnnotationLayer={true}
              renderTextLayer={false}
              onLoadSuccess={onPageLoadSuccess}
              inputRef={pageRef}
            />
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
      <button type="button" onClick={handleSubmit}>
        Submit
      </button>
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
