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
        right: offsetX, // Update right coordinate
        bottom: offsetY, // Update bottom coordinate
      }));
    }
  };

  const handleMouseUp = () => {
    if (currentRectangle) {
      // Calculate the coordinates for the rectangle
      const { left, top, right, bottom } = currentRectangle;
      const rectangleCoordinates = {
        left: Math.min(left, right),
        top: Math.min(top, bottom),
        right: Math.max(left, right),
        bottom: Math.max(top, bottom),
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
    // URL of the API endpoint
    const apiUrl =
      "https://crm.nablasol.net/custom/service/v4_1_custom/nblDmsPdfExtract.php";

    // Data to be sent to the API
    const postData = {
      allRectangles,
    };

    // Fetch request options
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any other headers as needed
      },
      body: JSON.stringify(postData),
    };

    // Send the fetch request
    fetch(apiUrl, requestOptions)
      .then((response) => {
        // Check if the request was successful (status code 2xx)
        if (response.ok) {
          // Parse the response body as JSON
          return response.json();
        } else {
          // Handle errors
          throw new Error("Failed to send data to the API");
        }
      })
      .then((data) => {
        // Handle the response data
        console.log("Response from API:", data);
      })
      .catch((error) => {
        // Handle errors that occurred during the fetch request
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
