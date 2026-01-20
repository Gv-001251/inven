import React, { useState, useRef, useEffect } from 'react';
import {
    HiOutlineDocumentText,
    HiOutlineReceiptTax,
    HiOutlineTruck,
    HiOutlineClipboard,
    HiOutlineDownload,
    HiChevronDown
} from 'react-icons/hi';
import html2pdf from 'html2pdf.js';

// Import the actual page components
import Invoice from './Invoice';
import EInvoice from './EInvoice';
import DeliveryChallan from './DeliveryChallan';

const Bills = () => {
    const [activeTab, setActiveTab] = useState('invoice');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [selectedBillTypes, setSelectedBillTypes] = useState({
        invoice: false,
        einvoice: false,
        eway: false,
        challan: false
    });
    const dropdownRef = useRef(null);

    const tabs = [
        { id: 'invoice', label: 'Invoice', icon: HiOutlineDocumentText },
        { id: 'einvoice', label: 'E-Invoice', icon: HiOutlineReceiptTax },
        // { id: 'eway', label: 'E-way Bill', icon: HiOutlineTruck },
        { id: 'challan', label: 'Delivery Challan', icon: HiOutlineClipboard }
    ];

    const billTypes = [
        { id: 'invoice', label: 'Invoice' },
        { id: 'einvoice', label: 'E-Invoice' },
        { id: 'eway', label: 'E-Way Bill' },
        { id: 'challan', label: 'Delivery Challan' }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCheckboxChange = (billType) => {
        setSelectedBillTypes(prev => ({
            ...prev,
            [billType]: !prev[billType]
        }));
    };

    const handleDownloadSelected = async () => {
        const selectedTypes = Object.entries(selectedBillTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);

        if (selectedTypes.length === 0) {
            alert('Please select at least one bill type to download');
            return;
        }

        try {
            // Create a container for all bills
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-10000px';
            container.style.top = '-10000px';
            container.style.width = '794px';
            document.body.appendChild(container);

            // Add each selected bill type to container
            for (const type of selectedTypes) {
                const billElement = document.createElement('div');
                billElement.style.pageBreakAfter = 'always';
                billElement.style.marginBottom = '20px';

                // Get the content based on bill type
                let content = '';
                switch (type) {
                    case 'invoice':
                        const invoicePreview = document.querySelector('#invoice-preview');
                        if (invoicePreview) content = invoicePreview.innerHTML;
                        break;
                    case 'einvoice':
                        // Get E-Invoice preview from the form
                        const einvoicePreview = document.querySelector('#einvoice-preview');
                        if (einvoicePreview) content = einvoicePreview.innerHTML;
                        break;
                    case 'eway':
                        // Get E-Way Bill preview if available
                        const ewayPreview = document.querySelector('#eway-preview');
                        if (ewayPreview) content = ewayPreview.innerHTML;
                        break;
                    case 'challan':
                        const challanPreview = document.querySelector('#challan-preview');
                        if (challanPreview) content = challanPreview.innerHTML;
                        break;
                }

                if (content) {
                    billElement.innerHTML = content;
                    container.appendChild(billElement);
                }
            }

            // Generate PDF
            const opt = {
                margin: 10,
                filename: `Bills_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(container).save();

            // Cleanup
            document.body.removeChild(container);
            setShowDownloadMenu(false);
            setSelectedBillTypes({
                invoice: false,
                einvoice: false,
                eway: false,
                challan: false
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };


    const renderContent = () => {
        // Render all components but only show the active one
        return (
            <>
                <div style={{ display: activeTab === 'invoice' ? 'block' : 'none' }}>
                    <Invoice />
                </div>
                <div style={{ display: activeTab === 'einvoice' ? 'block' : 'none' }}>
                    <EInvoice />
                </div>
                <div style={{ display: activeTab === 'challan' ? 'block' : 'none' }}>
                    <DeliveryChallan />
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Tab Navigation */}
            <div className="bg-green-50 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-2 text-lg font-medium transition-all cursor-pointer
                  ${isActive
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-primary/60 hover:text-primary'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Download Bills Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <HiOutlineDownload className="text-lg" />
                            Download Bills
                            <HiChevronDown className={`text-lg transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Select Bills to Download</h3>
                                    <div className="space-y-2 mb-4">
                                        {billTypes.map((type) => (
                                            <label
                                                key={type.id}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBillTypes[type.id]}
                                                    onChange={() => handleCheckboxChange(type.id)}
                                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                />
                                                <span className="text-sm text-gray-700">{type.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleDownloadSelected}
                                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                                    >
                                        Download Selected
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Content - All rendered, but only active one is visible */}
            <div className="bg-surface">
                {renderContent()}
            </div>
        </div>
    );
};

export default Bills;

