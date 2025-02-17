import '../App.css'
import React, { useState, useEffect, use } from 'react'
import SplitText from './SplitText'
import { Modal, Button } from "react-bootstrap";
import { CheckCircle } from "lucide-react";

/*
  Las facturas recibidas pueden tener notas de crédito asociadas:
  {
    receivedInvoices = [
      {
        "id": "inv_KedI7Yt22XM64129",
        "amount": 16000,
        "currency": "USD",
        "organization_id": "piedpiper",
        "type": "received"
        
        Nuevo campo para almacenar sus notas de crédito asociadas:

        "credit-notes": [ {"id": "inv_QerT7Yt22XM64MN3", "amount": 4000000, "currency": "CLP", "organization_id": "piedpiper", "type": "credit_note", "reference": "inv_KedI7Yt22XM64129"}, ... ] 
      }
    ]
  }
*/

export default function Main() {
  const [invoices, setInvoices] = useState([]);
  const [receivedInvoices, setReceivedInvoices] = useState([]);
  const [selectedReceivedInvoice, setSelectedReceivedInvoice] = useState('');
  const [selectedCreditNote, setSelectedCreditNote] = useState('');
  const [creditNotesAssigned, setCreditNotesAssigned] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);

  // Obtener todas las facturas
  useEffect(() => {
    const getInvoices = async () => {
      try {
        const response = await fetch('https://recruiting.api.bemmbo.com/invoices/pending');
        const data = await response.json();
        setInvoices(data);
      } 
      
      catch (error) {
        console.error('Error', error);
      }
    };

    getInvoices();
  }, []);

  // Agregar el nuevo campo "credit-notes" a cada factura type: received
  const filterInvoices = () => {
    let creditNotesDict = {};
  
    invoices.forEach(invoice => {
      if (invoice.type === "credit_note") {
        // Asumiendo de que todas las notas de crédito tendrán un '.reference'
        if (!creditNotesDict[invoice.reference]) {
          creditNotesDict[invoice.reference] = [];
        }
        creditNotesDict[invoice.reference].push(invoice);
      }
    });

    /*
      En este punto, creditNotesDict es de la forma 'id factura recibida': [sus notas de credito]:

      {
        "inv_KedI7Yt22XM64129": [
        {
          "id": "inv_QerT7Yt22XM64MN3",
          "amount": 4000000,
          "currency": "CLP",
          "organization_id": "piedpiper",
          "type": "credit_note",
          "reference": "inv_KedI7Yt22XM64129"
        }
      }
    */
    
    let receivedWithCreditNotes = invoices
      .filter(invoice => invoice.type === "received") 
      .map(invoice => ({
        ...invoice,
        "credit-notes": creditNotesDict[invoice.id] || []
      }));
  
    setReceivedInvoices(receivedWithCreditNotes);
  };

  // Cuando las facturas ya se hayan recibido desde el endpoint, se les agrega su nota de crédito con filterInvoices()
  useEffect(() => {
    filterInvoices();
  }, [invoices]);
  

  // Funciones auxiliares para hacerlo bonito
  function convertCLPtoDollar(clpAmount) {
    const exchangeRate = 0.0011; // 1 CLP = 0.0011 USD
    return (clpAmount * exchangeRate);
  }

  function convertDollartoCLP(usdAmount) {
    const exchangeRate = 952.38; // 1 USD = 952.38 CLP
    return (usdAmount * exchangeRate);
  }

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  // Funciones auxiliares para hacerlo bonito

  return (
    <div className='main-container'>
        <div className='content'>
        
        {/* Texto de bienvenida */}
        <SplitText
            text="Bemmbito"
            className="text-6xl font-semibold text-center mb-80"
            delay={150}
            animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
            animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
            easing="easeOutCubic"
            threshold={0.2}
            rootMargin="-50px"
          />    


          {/* Divider */}
          <hr style={{ margin: '20px 0', border: '1px solid #ccc' }} />


          {/* Seleccionar una factura */}
          <div style={{marginTop: '60px'}}>
            <h3 style={{marginBottom:'10px'}}> Selecciona una factura </h3>
            {receivedInvoices.map(invoice => (
              <div className="card" key={invoice.id}>
                <input onClick={() => setSelectedReceivedInvoice(invoice.id)} type="radio" name="invoice" style={{width: '18px', height: '18px', accentColor: '#6366F1'}} />

                <p>
                  {invoice.id.substring(0, 7)}... ({invoice.organization_id})
                </p>

                <p style={{ textAlign: 'center' }}>
                  <span>${invoice.amount} {invoice.currency} </span> 
                  <span style={{ color: '#6c757d' }}> 
                    (${invoice.currency === 'USD' ? convertDollartoCLP(invoice.amount) : convertCLPtoDollar(invoice.amount)} {invoice.currency === 'USD' ? 'CLP' : 'USD'})
                  </span>                
                </p>

                <p style={{ textAlign: 'end'}}>Recibida</p>
              </div>
            ))}

            {/* Si se seleccionó una factura, desplegar sus notas de crédito */}
            {selectedReceivedInvoice && (
              <>
                <h3 style={{marginBottom:'10px', marginTop: '50px'}}> Selecciona una nota de crédito </h3>
                
                {receivedInvoices.filter(invoice => invoice.id === selectedReceivedInvoice)
                  .map(invoice => (
                    
                    <div key={invoice.id}>
                      
                      {/* Verificar que tenga notas de crédito */}
                      {invoice["credit-notes"].length === 0 ? (
                        <p style={{color: '#6c757d'}}>No hay notas de crédito para la factura seleccionada</p>
                      ) 
                      :
                      (
                        invoice["credit-notes"].map(creditNote => (
                          <div key={creditNote.id} className="card">
                          
                            <input type="checkbox" onClick={() => setSelectedCreditNote(creditNote.id)}  name="invoice" style={{width: '18px', height: '18px', accentColor: '#6366F1'}} />
                            
                            <p>
                              {creditNote.id.substring(0, 7)}... ({creditNote.organization_id})
                            </p>

                            <p style={{ textAlign: 'center' }}>
                              <span>${creditNote.amount} {creditNote.currency} </span> 
                              <span style={{ color: '#6c757d' }}> 
                                (${creditNote.currency === 'USD' ? convertDollartoCLP(creditNote.amount) : convertCLPtoDollar(creditNote.amount)} {creditNote.currency === 'USD' ? 'CLP' : 'USD'})
                              </span>
                            </p>

                            <p style={{ textAlign: 'end'}}>{creditNote.reference.substring(0, 7)}...</p>
                          </div>
                        
                        ))
                      )}
                    </div>
                  ))
                }

                {/* Si hay una factura seleccionada y una nota de crédito seleccionada... */}
                {selectedReceivedInvoice && selectedCreditNote && (
                  <button id="assignButton" onClick={handleShowModal} style={{marginTop: '20px', padding: '17px 57px', marginBottom: '50px', background: 'linear-gradient(to bottom, blue, #00001cc3)'}}>
                    Asignar
                  </button>
                )}
                
                {/* Modal */}
                {showModal && (
                  <Modal
                    show={showModal}
                    onHide={handleCloseModal}
                    backdrop="static"
                    keyboard={false}
                    className="custom-modal"
                    centered
                >
                  <Modal.Body className="modal-success-body">
                    <div className="success-icon">
                      <CheckCircle size={50} color="blue" />
                    </div>

                    <p style={{marginTop: '20px', fontSize:'20px', fontWeight: '600', maxWidth: '250px', textAlign: 'center'}}>Nota de crédito asignada correctamente</p>
                  </Modal.Body>
                  
                  <Modal.Footer className="modal-success-footer">
                    <Button className="success-button" onClick={handleCloseModal}>
                      Seguir asignando
                    </Button>
                  </Modal.Footer>
                
                </Modal>
                )}

              </>

            )}

          </div>
        </div>
    </div>
  )
}
