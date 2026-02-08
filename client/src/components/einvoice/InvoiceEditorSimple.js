import React from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineQrcode } from 'react-icons/hi';

const InvoiceEditorSimple = ({
    invoiceForm,
    handleFormChange,
    handleItemChange,
    addItemRow,
    removeItemRow,
    states,
    hsnCodes,
    totals,
    generating,
    handleGenerateIRN,
    selectedBusiness,
    missingFields = [] // New prop for validation
}) => {
    const formatCurrency = (val) => {
        const numVal = parseFloat(val);
        return `₹${(isNaN(numVal) ? 0 : numVal).toFixed(2)}`;
    };

    const inputClass = "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all text-sm";
    const labelClass = "block text-xs font-medium mb-1.5 text-white/90";

    // Helper to check if field is missing and needs highlighting
    const getInputClass = (fieldName) => {
        const isMissing = missingFields.includes(fieldName);
        return isMissing
            ? "w-full bg-white/10 border-2 border-red-500 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all text-sm"
            : inputClass;
    };

    // Wrapper component for inputs with validation overlay
    const InputWrapper = ({ fieldName, children }) => {
        const isMissing = missingFields.includes(fieldName);
        return (
            <div className="relative">
                {children}
                {isMissing && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1 animate-bounce z-10">
                        <span>⚠️</span>
                        <span className="font-medium">Needs to be filled</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-4 lg:p-6">
            <form onSubmit={handleGenerateIRN} className="space-y-6">
                {/* Customer Details Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-teal-400 border-b border-white/10 pb-2">Bill To</h3>

                    <div>
                        <label className={labelClass}>Customer Name</label>
                        <input
                            type="text"
                            name="recipientName"
                            value={invoiceForm.recipientName || ''}
                            onChange={handleFormChange}
                            placeholder="Customer Name"
                            className={getInputClass('recipientName')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Phone no</label>
                            <input
                                type="tel"
                                name="recipientPhone"
                                value={invoiceForm.recipientPhone || ''}
                                onChange={handleFormChange}
                                placeholder="Customer Phone no"
                                className={getInputClass('recipientPhone')}
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
                                className={getInputClass('recipientEmail')}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Address</label>
                        <textarea
                            name="recipientAddress"
                            value={invoiceForm.recipientAddress || ''}
                            onChange={handleFormChange}
                            placeholder="Customer Address"
                            rows={2}
                            className={getInputClass('recipientAddress')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Country</label>
                            <input
                                type="text"
                                name="recipientCountry"
                                value={invoiceForm.recipientCountry || ''}
                                onChange={handleFormChange}
                                placeholder="Country"
                                className={getInputClass('recipientCountry')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>GST No.</label>
                            <input
                                type="text"
                                name="recipientGstin"
                                value={invoiceForm.recipientGstin || ''}
                                onChange={handleFormChange}
                                placeholder="GST Number"
                                maxLength={15}
                                className={`${getInputClass('recipientGstin')} uppercase`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Place of Supply</label>
                        <input
                            type="text"
                            name="placeOfSupply"
                            value={invoiceForm.placeOfSupply || ''}
                            onChange={handleFormChange}
                            placeholder="Place of Supply"
                            className={getInputClass('placeOfSupply')}
                        />
                    </div>
                </div>

                {/* Reference Details Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-teal-400 border-b border-white/10 pb-2">Reference Details</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>e-Inv No.</label>
                            <input
                                type="text"
                                name="eInvoiceNo"
                                value={invoiceForm.eInvoiceNo || ''}
                                onChange={handleFormChange}
                                placeholder="e-Invoice Number"
                                className={getInputClass('eInvoiceNo')}
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
                                className={getInputClass('deliveryNote')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Supplier's Ref.</label>
                            <input
                                type="text"
                                name="supplierRef"
                                value={invoiceForm.supplierRef || ''}
                                onChange={handleFormChange}
                                placeholder="Supplier Reference"
                                className={getInputClass('supplierRef')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Other Reference(s)</label>
                            <input
                                type="text"
                                name="otherReferences"
                                value={invoiceForm.otherReferences || ''}
                                onChange={handleFormChange}
                                placeholder="Other References"
                                className={getInputClass('otherReferences')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Buyer's Order No.</label>
                            <input
                                type="text"
                                name="buyerOrderNo"
                                value={invoiceForm.buyerOrderNo || ''}
                                onChange={handleFormChange}
                                placeholder="Buyer's Order Number"
                                className={getInputClass('buyerOrderNo')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Buyer's Order Date</label>
                            <input
                                type="date"
                                name="buyerOrderDate"
                                value={invoiceForm.buyerOrderDate || ''}
                                onChange={handleFormChange}
                                className={getInputClass('buyerOrderDate')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Dispatch Document No.</label>
                            <input
                                type="text"
                                name="dispatchDocNo"
                                value={invoiceForm.dispatchDocNo || ''}
                                onChange={handleFormChange}
                                placeholder="Dispatch Document Number"
                                className={getInputClass('dispatchDocNo')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Delivery Note Date</label>
                            <input
                                type="date"
                                name="deliveryNoteDate"
                                value={invoiceForm.deliveryNoteDate || ''}
                                onChange={handleFormChange}
                                className={getInputClass('deliveryNoteDate')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Despatched Through</label>
                            <input
                                type="text"
                                name="despatchedThrough"
                                value={invoiceForm.despatchedThrough || ''}
                                onChange={handleFormChange}
                                placeholder="Despatched Through"
                                className={getInputClass('despatchedThrough')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Destination</label>
                            <input
                                type="text"
                                name="destination"
                                value={invoiceForm.destination || ''}
                                onChange={handleFormChange}
                                placeholder="Destination"
                                className={getInputClass('destination')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Terms of Delivery</label>
                            <input
                                type="text"
                                name="termsOfDelivery"
                                value={invoiceForm.termsOfDelivery || ''}
                                onChange={handleFormChange}
                                placeholder="Terms of Delivery"
                                className={getInputClass('termsOfDelivery')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Mode/Terms of Payment</label>
                            <input
                                type="text"
                                name="modeOfPayment"
                                value={invoiceForm.modeOfPayment || ''}
                                onChange={handleFormChange}
                                placeholder="Mode of Payment"
                                className={getInputClass('modeOfPayment')}
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-teal-400 border-b border-white/10 pb-2">Invoice Details</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Invoice Number</label>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={invoiceForm.invoiceNumber || ''}
                                onChange={handleFormChange}
                                placeholder="Auto-Generated"
                                className={getInputClass('invoiceNumber')}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Invoice Date</label>
                            <input
                                type="date"
                                name="invoiceDate"
                                value={invoiceForm.invoiceDate || ''}
                                onChange={handleFormChange}
                                className={getInputClass('invoiceDate')}
                            />
                        </div>
                    </div>
                </div>

                {/* Item Details */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="text-lg font-bold text-teal-400">Item Details</h3>
                        <button
                            type="button"
                            onClick={addItemRow}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors text-white text-sm font-medium"
                        >
                            <HiOutlinePlus className="text-base" />
                            Add Item
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-white/60 uppercase px-2">
                        <div>ITEM(s)</div>
                        <div>QUANTITY</div>
                        <div>PRICE</div>
                        <div>TOTAL</div>
                    </div>

                    <div className="space-y-2">
                        {invoiceForm.items && invoiceForm.items.map((item, index) => (
                            <div key={item.id || index} className="bg-white/5 rounded-lg p-3 space-y-2 border border-white/10">
                                {/* Item Name & HSN */}
                                <div className="grid grid-cols-2 gap-2">
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

                                {/* Quantity, Unit, Price, GST, Total */}
                                <div className="grid grid-cols-6 gap-2 items-center">
                                    <input
                                        type="number"
                                        value={item.qty || ''}
                                        onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                        placeholder="Qty"
                                        min="1"
                                        className={`${inputClass} text-center`}
                                    />
                                    <select
                                        value={item.unit || 'Nos'}
                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                        className={`${inputClass} text-center`}
                                    >
                                        <option value="Nos" className="bg-[#06302C]">Nos</option>
                                        <option value="Pcs" className="bg-[#06302C]">Pcs</option>
                                        <option value="Kg" className="bg-[#06302C]">Kg</option>
                                        <option value="Ltr" className="bg-[#06302C]">Ltr</option>
                                        <option value="Box" className="bg-[#06302C]">Box</option>
                                        <option value="Set" className="bg-[#06302C]">Set</option>
                                    </select>
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
                                    <div className="bg-white/5 border border-white/20 rounded-lg px-2 py-2.5 text-right text-white font-medium text-sm">
                                        {formatCurrency((item.qty || 0) * (item.rate || 0))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItemRow(index)}
                                        disabled={invoiceForm.items.length === 1}
                                        className="bg-red-600/20 hover:bg-red-600/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg p-2 transition-colors"
                                    >
                                        <HiOutlineTrash className="text-lg text-red-400 mx-auto" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tax & Discount */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
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
                    <div>
                        <label className={labelClass}>Notes / Terms</label>
                        <textarea
                            placeholder="Thank you for your business.&#10;Please make payment within 7 days."
                            rows={2}
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Totals Display */}
                <div className="sticky bottom-0 bg-[#06302C] pt-4 pb-2">
                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
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
                        <div className="flex justify-between text-base font-bold border-t border-white/20 pt-2 text-white">
                            <span>Total:</span>
                            <span className="text-teal-400">{formatCurrency(totals?.invoiceTotal)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={generating}
                        className="w-full mt-3 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-sm"
                    >
                        {generating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating IRN...
                            </>
                        ) : (
                            <>
                                <HiOutlineQrcode className="text-lg" />
                                Generate IRN & Save
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceEditorSimple;
