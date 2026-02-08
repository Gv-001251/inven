import React, { useState } from 'react';
import { HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi';

const InvoiceVisualPreview = ({ invoiceForm, selectedBusiness, onEditSection, amountInWords, totals }) => {
    const [hoveredSection, setHoveredSection] = useState(null);

    const EditableSection = ({ sectionId, children, className = "", isEmpty = false }) => {
        const isHovered = hoveredSection === sectionId;

        return (
            <div
                className={`relative transition-all duration-200 ${className} ${isHovered ? 'ring-2 ring-teal-400 ring-dashed bg-teal-50/30' : ''
                    } cursor-pointer group`}
                onMouseEnter={() => setHoveredSection(sectionId)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => onEditSection && onEditSection(sectionId)}
            >
                {children}

                {/* Edit Button - shows on hover */}
                {isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center bg-teal-500/10 rounded-lg">
                        <div className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium">
                            {isEmpty ? (
                                <>
                                    <HiOutlinePlus className="text-lg" />
                                    Add Details
                                </>
                            ) : (
                                <>
                                    <HiOutlinePencil className="text-lg" />
                                    Edit Section
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(val || 0);

    return (
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-[800px] mx-auto" style={{ minHeight: '1100px' }}>
            {/* Invoice Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900">Tax Invoice</h1>
            </div>

            {/* Top Section: Supplier & Invoice Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Supplier Details */}
                <EditableSection sectionId="supplier" className="p-4 rounded-lg">
                    <div className="text-sm">
                        <h3 className="font-bold text-base text-gray-900 mb-1">
                            {selectedBusiness?.name || 'Your Company Name'}
                        </h3>
                        <p className="text-gray-700">
                            {selectedBusiness?.address || 'Company Address'}<br />
                            Ph: {selectedBusiness?.phone || '+91 XXXXXXXXXX'}
                        </p>
                        <p className="mt-2">
                            <span className="font-semibold">GSTIN/UIN: </span>
                            <span className="font-bold">{selectedBusiness?.gstin || 'XXAABCTXXXXAXZX'}</span>
                        </p>
                    </div>
                </EditableSection>

                {/* Invoice Metadata */}
                <EditableSection sectionId="metadata" className="p-4 rounded-lg">
                    <table className="w-full text-xs border border-gray-300">
                        <tbody>
                            <tr className="border-b border-gray-300">
                                <td className="p-2 font-semibold bg-gray-50">Invoice No.</td>
                                <td className="p-2">{invoiceForm.invoiceNumber || '---'}</td>
                            </tr>
                            <tr className="border-b border-gray-300">
                                <td className="p-2 font-semibold bg-gray-50">Dated</td>
                                <td className="p-2">{invoiceForm.invoiceDate || '---'}</td>
                            </tr>
                            <tr className="border-b border-gray-300">
                                <td className="p-2 font-semibold bg-gray-50">E-Invoice No.</td>
                                <td className="p-2">{invoiceForm.eInvoiceNo || 'Auto-Generated'}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold bg-gray-50">Delivery Note</td>
                                <td className="p-2">{invoiceForm.deliveryNote || '---'}</td>
                            </tr>
                        </tbody>
                    </table>
                </EditableSection>
            </div>

            {/* Buyer Details Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Consignee */}
                <EditableSection
                    sectionId="buyer"
                    className="p-4 rounded-lg border border-gray-300"
                    isEmpty={!invoiceForm.recipientName}
                >
                    <div className="text-sm">
                        <h4 className="font-bold text-gray-900 mb-2">Consignee</h4>
                        {invoiceForm.recipientName ? (
                            <>
                                <p className="font-semibold">{invoiceForm.recipientName}</p>
                                <p className="text-gray-700 mt-1">
                                    {invoiceForm.recipientAddress || 'Address not provided'}
                                </p>
                                <p className="mt-2">
                                    <span className="font-semibold">GSTIN: </span>
                                    {invoiceForm.recipientGstin || '---'}
                                </p>
                                <p>
                                    <span className="font-semibold">State: </span>
                                    {invoiceForm.recipientState || '---'}
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-400 text-center py-8">Click to add buyer details</p>
                        )}
                    </div>
                </EditableSection>

                {/* Buyer (same as consignee for now) */}
                <div className="p-4 rounded-lg border border-gray-300">
                    <div className="text-sm">
                        <h4 className="font-bold text-gray-900 mb-2">Buyer</h4>
                        {invoiceForm.recipientName ? (
                            <>
                                <p className="font-semibold">{invoiceForm.recipientName}</p>
                                <p className="text-gray-700 mt-1">
                                    Country: {invoiceForm.recipientCountry || 'India'}
                                </p>
                                <p className="mt-1">
                                    GST No: {invoiceForm.recipientVat || invoiceForm.recipientGstin || '---'}
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-400 text-center py-8">Same as consignee</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Reference Details */}
            <div className="mb-6">
                <EditableSection sectionId="references" className="p-3 rounded-lg border border-gray-300">
                    <table className="w-full text-xs">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold w-1/2">Buyer's Order No.</td>
                                <td className="py-2">{invoiceForm.buyerOrderNo || '---'}</td>
                                <td className="py-2 font-semibold">Dated</td>
                                <td className="py-2">{invoiceForm.buyerOrderDate || '---'}</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-semibold">Dispatch Document No.</td>
                                <td className="py-2">{invoiceForm.dispatchDocNo || '---'}</td>
                                <td className="py-2 font-semibold">Delivery Note Date</td>
                                <td className="py-2">{invoiceForm.deliveryNoteDate || '---'}</td>
                            </tr>
                        </tbody>
                    </table>
                </EditableSection>
            </div>

            {/* Items Table */}
            <EditableSection sectionId="items" className="mb-6" isEmpty={!invoiceForm.items || invoiceForm.items.length === 0}>
                <table className="w-full text-xs border border-gray-800">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-800 p-2 text-left">Sl No.</th>
                            <th className="border border-gray-800 p-2 text-left">Description of Goods</th>
                            <th className="border border-gray-800 p-2 text-center">Quantity</th>
                            <th className="border border-gray-800 p-2 text-right">Rate</th>
                            <th className="border border-gray-800 p-2 text-center">per</th>
                            <th className="border border-gray-800 p-2 text-center">GST %</th>
                            <th className="border border-gray-800 p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceForm.items && invoiceForm.items.length > 0 ? (
                            invoiceForm.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-800 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-gray-800 p-2">{item.product || '---'}</td>
                                    <td className="border border-gray-800 p-2 text-center">{item.qty || 0} Nos</td>
                                    <td className="border border-gray-800 p-2 text-right">{formatCurrency(item.rate || 0)}</td>
                                    <td className="border border-gray-800 p-2 text-center">Nos</td>
                                    <td className="border border-gray-800 p-2 text-center">{item.gstPercent || 0}%</td>
                                    <td className="border border-gray-800 p-2 text-right font-semibold">
                                        {formatCurrency((item.qty || 0) * (item.rate || 0))}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="border border-gray-800 p-12 text-center">
                                    <p className="text-gray-400 text-base">Click to add items</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </EditableSection>

            {/* Totals Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Amount in Words */}
                <div className="p-4">
                    <p className="text-xs">
                        <span className="font-semibold">Amount Chargeable (in words):</span><br />
                        <span className="font-bold text-sm">
                            {amountInWords(Math.round(totals?.invoiceTotal || 0))}
                        </span>
                    </p>
                </div>

                {/* Tax Breakdown */}
                <div className="border border-gray-800">
                    <table className="w-full text-xs">
                        <tbody>
                            <tr className="border-b border-gray-800">
                                <td className="p-2 font-semibold bg-gray-50">Taxable Value</td>
                                <td className="p-2 text-right font-bold">{formatCurrency(totals?.taxableValue || 0)}</td>
                            </tr>
                            <tr className="border-b border-gray-800">
                                <td className="p-2 font-semibold bg-gray-50">CGST</td>
                                <td className="p-2 text-right">{formatCurrency(totals?.cgst || 0)}</td>
                            </tr>
                            <tr className="border-b border-gray-800">
                                <td className="p-2 font-semibold bg-gray-50">SGST</td>
                                <td className="p-2 text-right">{formatCurrency(totals?.sgst || 0)}</td>
                            </tr>
                            <tr className="bg-gray-100">
                                <td className="p-2 font-bold text-base">Invoice Total</td>
                                <td className="p-2 text-right font-bold text-base">{formatCurrency(totals?.invoiceTotal || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t-2 border-gray-300">
                {/* QR Code Section */}
                <div className="border border-gray-300 p-4 flex items-center justify-center">
                    {invoiceForm.qrCode ? (
                        <img src={invoiceForm.qrCode} alt="QR Code" className="w-24 h-24" />
                    ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                            QR Code
                        </div>
                    )}
                </div>

                {/* Signature Section */}
                <div className="border border-gray-300 p-4 flex flex-col justify-between">
                    <p className="text-xs text-gray-600 mb-8">for {selectedBusiness?.name || 'Your Company'}</p>
                    <p className="text-xs text-right font-semibold">Authorised Signatory</p>
                </div>
            </div>

            {/* Computer Generated Note */}
            <div className="text-center mt-4">
                <p className="text-xs text-gray-500">This is a Computer Generated Invoice</p>
            </div>
        </div>
    );
};

export default InvoiceVisualPreview;
