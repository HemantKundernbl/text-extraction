import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import Modal from "react-modal";
import axios from "axios";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const Viewer = () => {
  const [pdfUrl, setPdfUrl] = useState({ file: null, totalNumPages: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedTextCoordinates, setSelectedTextCoordinates] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pdfRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    console.log(file);

    if (file) {
      const pdfDocument = await pdfjs.getDocument(URL.createObjectURL(file))
        .promise;
      const totalNumPages = pdfDocument.numPages;
      setPdfUrl({ file, totalNumPages });
      setIsModalOpen(true);
    }
  };

  const handleSelection = async () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedTextCoordinates({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      });
    }
  };

  const sendCoordinates = async () => {
    console.log(selectedTextCoordinates);
    const coordinatesString = selectedTextCoordinates
      ? Object.values(selectedTextCoordinates).join(", ")
      : "";
    console.log(coordinatesString);

    const formData = new FormData();
    formData.append("coordinates", coordinatesString);
    formData.append("pdfFile", pdfUrl.file);
    try {
      const res = await axios.post(
        "https://crm.nablasol.net/custom/service/v4_1_custom/nblDmsPdfExtract.php",
        formData
      );
    } catch (err) {}
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPdfUrl({ file: null, totalNumPages: 0 });
    setSelectedTextCoordinates(null);
  };

  useEffect(() => {
    sendCoordinates();
  }, [selectedTextCoordinates]);

  console.log(pdfUrl);

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".pdf" />

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="PDF Preview"
      >
        {pdfUrl.file && (
          <div ref={pdfRef} onMouseUp={handleSelection}>
            <Document file={pdfUrl.file} onLoadSuccess={() => setPageNumber(1)}>
              {[...Array(pdfUrl.totalNumPages)].map((_, index) => (
                <Page
                  key={index + 1}
                  pageNumber={index + 1}
                  renderTextLayer={true} // Set this to true
                  renderAnnotationLayer={false} // Set this to false
                />
              ))}
            </Document>

            {selectedTextCoordinates && (
              <div>
                Selected text coordinates:
                {JSON.stringify(selectedTextCoordinates)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Viewer;
