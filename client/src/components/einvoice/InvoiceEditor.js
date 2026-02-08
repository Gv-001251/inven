import React from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineQrcode, HiOutlineCursorClick } from 'react-icons/hi';

const InvoiceEditor = ({
    invoiceForm,
    handleFormChange,
    handleItemChange,
    addItemRow,
    removeItemRow,
    activeSection,
    states,
    hsnCodes,
    totals,
    generating,
    handleGenerateIRN,
    selectedBusiness
}) => {
    const formatCurrency = (val) => {
        const numVal = parseFloat(val);
        return `₹${(isNaN(numVal) ? 0 : numVal).toFixed(2)}`;
    };

    // Empty State - shown when no section is selected
    if (!activeSection || activeSection === null) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-teal-400/40 flex items-center justify-center">
                            <HiOutlineCursorClick className="text-5xl text-teal-400/60" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white/90 mb-2">Select the section to edit</h3>
                    <p className="text-white/60 text-sm max-w-xs mx-auto">
                        Click on any section of the invoice preview to start editing
                    </p>
                </div>
            </div>
        );
    }

    // Dynamic input styling
    const inputClass = "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all";
    const labelClass = "block text-sm font-medium mb-2 text-white/90";
    const sectionClass = "space-y-4";

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-8">
            <form onSubmit={handleGenerateIRN} className="space-y-6">
                {/* Buyer/Consignee Section */}
                {activeSection === 'buyer' && (
                    <div className={sectionClass}>
                        <h2 className="text-2xl font-bold mb-6 text-teal-400">Bill To</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Customer Name</label>
                                <input
                                    type="text"
                                    name="recipientName"
                                    value={invoiceForm.recipientName || ''}
                                    onChange={handleFormChange}
                                    placeholder="Customer Name"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Phone no</label>
                                <input
                                    type="tel"
                                    name="recipientPhone"
                                    value={invoiceForm.recipientPhone || ''}
                                    onChange={handleFormChange}
                                    placeholder="Customer Phone no"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    name="recipientEmail"
                                    value={invoiceForm.recipientEmail || ''}
                                    onChange={handleFormChange}
                                    placeholder="Customer Email"
                                    className={inputClass}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Address</label>
                                <textarea
                                    name="recipientAddress"
                                    value={invoiceForm.recipientAddress || ''}
                                    onChange={handleFormChange}
                                    placeholder="Customer Address"
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Currency</label>
                                <div className="flex gap-2">
                                    <div className="bg-teal-500/20 border border-teal-400/40 rounded-lg px-4 py-2.5 text-white flex items-center justify-center font-medium">
                                        ₹
                                    </div>
                                    <input
                                        type="text"
                                        value="Indian Rupee"
                                        disabled
                                        className={`${inputClass} flex-1 opacity-70 cursor-not-allowed`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>GST Number (Optional)</label>
                                <input
                                    type="text"
                                    name="recipientGstin"
                                    value={invoiceForm.recipientGstin || ''}
                                    onChange={handleFormChange}
                                    placeholder="GST Number"
                                    maxLength={15}
                                    className={`${inputClass} uppercase`}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Metadata Section */}
                {activeSection === 'metadata' && (
                    <div className={sectionClass}>
                        <h2 className="text-2xl font-bold mb-6 text-teal-400">Invoice Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Invoice Number</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={invoiceForm.invoiceNumber || ''}
                                        onChange={handleFormChange}
                                        placeholder="Auto-Generated"
                                        className={inputClass}
                                    />
                                    <button
                                        type="button"
                                        className="bg-teal-500/20 border border-teal-400/40 rounded-lg px-4 py-2.5 text-white hover:bg-teal-500/30 transition-colors whitespace-nowrap"
                                    >
                                        Auto-Generated
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Invoice Date</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    value={invoiceForm.invoiceDate || ''}
                                    onChange={handleFormChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>E-Invoice No.</label>
                                <input
                                    type="text"
                                    name="eInvoiceNo"
                                    value={invoiceForm.eInvoiceNo || ''}
                                    onChange={handleFormChange}
                                    placeholder="E-Invoice Number"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Delivery Note</label>
                                <input
                                    type="text"
                                    name="deliveryNote"
                                    value={invoiceForm.deliveryNote || ''}
                                    onChange={handleFormChange}
                                    placeholder="Delivery Note"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* References Section */}
                {activeSection === 'references' && (
                    <div className={sectionClass}>
                        <h2 className="text-2xl font-bold mb-6 text-teal-400">Reference Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Buyer's Order No.</label>
                                <input
                                    type="text"
                                    name="buyerOrderNo"
                                    value={invoiceForm.buyerOrderNo || ''}
                                    onChange={handleFormChange}
                                    placeholder="Order Number"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Order Date</label>
                                <input
                                    type="date"
                                    name="buyerOrderDate"
                                    value={invoiceForm.buyerOrderDate || ''}
                                    onChange={handleFormChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Dispatch Document No.</label>
                                <input
                                    type="text"
                                    name="dispatchDocNo"
                                    value={invoiceForm.dispatchDocNo || ''}
                                    onChange={handleFormChange}
                                    placeholder="Dispatch Doc. No."
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Delivery Note Date</label>
                                <input
                                    type="date"
                                    name="deliveryNoteDate"
                                    value={invoiceForm.deliveryNoteDate || ''}
                                    onChange={handleFormChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Section */}
                {activeSection === 'items' && (
                    <div className={sectionClass}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-teal-400">Item Details</h2>
                            <button
                                type="button"
                                onClick={addItemRow}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors text-white font-medium border-2 border-dashed border-white/20"
                            >
                                <HiOutlinePlus className="text-lg" />
                                Add Item
                            </button>
                        </div>

                        {/* Item Headers */}
                        <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-white/60 uppercase">
                            <div>ITEM(s)</div>
                            <div>QUANTITY</div>
                            <div>PRICE</div>
                            <div>TOTAL</div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                            {invoiceForm.items && invoiceForm.items.map((item, index) => (
                                <div key={item.id || index} className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                                    {/* Item Name & HSN */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={item.product || ''}
                                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                            placeholder="Item name"
                                            className={inputClass}
                                        />
                                        <select
                                            value={item.hsn || ''}
                                            onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="" className="bg-[#06302C]">Select HSN Code</option>
                                            {hsnCodes && hsnCodes.map(hsn => (
                                                <option key={hsn.code} value={hsn.code} className="bg-[#06302C] text-white">
                                                    {hsn.code} - {hsn.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity, Price, GST, Total */}
                                    <div className="grid grid-cols-5 gap-2 items-center">
                                        <input
                                            type="number"
                                            value={item.qty || ''}
                                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                            placeholder="Qty"
                                            min="1"
                                            className={`${inputClass} text-center`}
                                        />
                                        <input
                                            type="number"
                                            value={item.rate || ''}
                                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                            placeholder="Price"
                                            step="0.01"
                                            className={`${inputClass} text-right`}
                                        />
                                        <select
                                            value={item.gstPercent || 18}
                                            onChange={(e) => handleItemChange(index, 'gstPercent', parseInt(e.target.value))}
                                            className={`${inputClass} text-center`}
                                        >
                                            <option value={0} className="bg-[#06302C]">0%</option>
                                            <option value={5} className="bg-[#06302C]">5%</option>
                                            <option value={12} className="bg-[#06302C]">12%</option>
                                            <option value={18} className="bg-[#06302C]">18%</option>
                                            <option value={28} className="bg-[#06302C]">28%</option>
                                        </select>
                                        <div className="bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-right text-white font-medium">
                                            {formatCurrency((item.qty || 0) * (item.rate || 0))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItemRow(index)}
                                            disabled={invoiceForm.items.length === 1}
                                            className="bg-red-600/20 hover:bg-red-600/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg p-2.5 transition-colors"
                                        >
                                            <HiOutlineTrash className="text-xl text-red-400 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tax & Discount */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                            <div>
                                <label className={labelClass}>Tax Percentage</label>
                                <select className={inputClass}>
                                    <option value={18} className="bg-[#06302C]">18%</option>
                                    <option value={12} className="bg-[#06302C]">12%</option>
                                    <option value={5} className="bg-[#06302C]">5%</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Discount(%)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className={labelClass}>Notes / Terms</label>
                            <textarea
                                placeholder="Thank you for your business.&#10;Please make payment within 7 days."
                                rows={3}
                                className={inputClass}
                            />
                        </div>
                    </div>
                )}

                {/* Supplier Section */}
                {activeSection === 'supplier' && (
                    <div className={sectionClass}>
                        <h2 className="text-2xl font-bold mb-6 text-teal-400">Supplier Details</h2>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className={labelClass}>Company Name</label>
                                <input
                                    type="text"
                                    value={selectedBusiness?.name || ''}
                                    disabled
                                    className={`${inputClass} opacity-70 cursor-not-allowed`}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>GSTIN</label>
                                <input
                                    type="text"
                                    value={selectedBusiness?.gstin || ''}
                                    disabled
                                    className={`${inputClass} opacity-70 cursor-not-allowed uppercase`}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Address</label>
                                <textarea
                                    value={selectedBusiness?.address || ''}
                                    disabled
                                    rows={3}
                                    className={`${inputClass} opacity-70 cursor-not-allowed`}
                                />
                            </div>

                            <div className="mt-2 p-4 bg-teal-500/10 border border-teal-400/20 rounded-lg">
                                <p className="text-sm text-white/70">
                                    💡 Supplier details are managed in Settings. Go to Settings → Business Profile to update.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Totals Display (always visible at bottom when section is active) */}
                {activeSection && activeSection !== null && (
                    <div className="sticky bottom-0 bg-[#06302C] pt-6 pb-4 border-t border-white/10">
                        <div className="bg-white/5 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between text-sm text-white/80">
                                <span>Taxable Value:</span>
                                <span className="font-medium">{formatCurrency(totals?.taxableValue)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-white/80">
                                <span>CGST:</span>
                                <span className="font-medium">{formatCurrency(totals?.cgst)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-white/80">
                                <span>SGST:</span>
                                <span className="font-medium">{formatCurrency(totals?.sgst)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white">
                                <span>Total:</span>
                                <span className="text-teal-400">{formatCurrency(totals?.invoiceTotal)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={generating}
                            className="w-full mt-4 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating IRN...
                                </>
                            ) : (
                                <>
                                    <HiOutlineQrcode className="text-xl" />
                                    Generate IRN & Save
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default InvoiceEditor;
