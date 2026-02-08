import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles using StyleSheet.create (React Native syntax)
const styles = StyleSheet.create({
    page: {
        padding: 15,
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    // Header Section (simplified without QR)
    header: {
        marginBottom: 6,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingBottom: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // IRN Details
    irnSection: {
        marginBottom: 4,
        fontSize: 8,
    },
    irnRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    irnLabel: {
        width: 60,
        fontWeight: 'bold',
    },
    irnValue: {
        flex: 1,
        fontFamily: 'Courier',
    },
    // Main Grid Table
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 20,
    },
    tableRowLast: {
        flexDirection: 'row',
        minHeight: 20,
    },
    tableCell: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
    },
    tableCellLast: {
        padding: 4,
        justifyContent: 'center',
    },
    tableCellHeader: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        backgroundColor: '#F5F5F5',
        fontWeight: 'bold',
        justifyContent: 'center',
    },
    // Column widths for main details table
    col50: { width: '50%' },
    col25: { width: '25%' },
    col33: { width: '33.33%' },
    // Supplier Details
    supplierSection: {
        padding: 6,
        minHeight: 70,
        justifyContent: 'flex-start',
    },
    supplierName: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    supplierText: {
        fontSize: 8,
        lineHeight: 1.3,
    },
    // Invoice Metadata
    metadataCell: {
        padding: 4,
        fontSize: 8,
    },
    metadataValue: {
        fontWeight: 'bold',
        fontSize: 9,
    },
    // Buyer Section
    buyerHeader: {
        backgroundColor: '#F5F5F5',
        padding: 4,
        fontWeight: 'bold',
    },
    buyerDetails: {
        padding: 6,
        minHeight: 50,
    },
    buyerName: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    buyerText: {
        fontSize: 8,
        lineHeight: 1.3,
    },
    // Items Table
    itemsTable: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
    },
    itemsHeader: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        fontWeight: 'bold',
        padding: 3,
    },
    itemsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        padding: 3,
    },
    itemsRowLast: {
        flexDirection: 'row',
        padding: 3,
    },
    // Item column widths
    itemCol1: { width: '5%', textAlign: 'center' },
    itemCol2: { width: '30%' },
    itemCol3: { width: '10%', textAlign: 'center' },
    itemCol4: { width: '12%', textAlign: 'center' },
    itemCol5: { width: '12%', textAlign: 'right' },
    itemCol6: { width: '8%', textAlign: 'center' },
    itemCol7: { width: '8%', textAlign: 'center' },
    itemCol8: { width: '15%', textAlign: 'right' },
    // Totals Section
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    amountWords: {
        width: '50%',
        padding: 5,
        fontSize: 8,
    },
    amountWordsLabel: {
        fontWeight: 'bold',
        marginBottom: 3,
    },
    amountWordsValue: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    totalsTable: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#000',
    },
    totalsTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    totalsTableRowLast: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
    },
    totalsLabel: {
        width: '60%',
        padding: 4,
        fontWeight: 'bold',
        backgroundColor: '#F5F5F5',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    totalsValue: {
        width: '40%',
        padding: 4,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalsFinal: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Footer
    footer: {
        flexDirection: 'row',
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#CCCCCC',
        paddingTop: 5,
    },
    footerQR: {
        width: '30%',
        borderWidth: 1,
        borderColor: '#CCCCCC',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerSignature: {
        width: '68%',
        borderWidth: 1,
        borderColor: '#CCCCCC',
        padding: 8,
        marginLeft: 8,
        justifyContent: 'space-between',
    },
    signatureText: {
        fontSize: 8,
        marginBottom: 30,
    },
    signatureLabel: {
        fontSize: 8,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    computerGenerated: {
        textAlign: 'center',
        fontSize: 8,
        color: '#666666',
        marginTop: 8,
    },
    // Helper styles
    bold: {
        fontWeight: 'bold',
    },
    textCenter: {
        textAlign: 'center',
    },
    textRight: {
        textAlign: 'right',
    },
    italic: {
        fontStyle: 'italic',
    },
});

// Invoice PDF Document Component
const InvoicePDF = ({ data, qrCode, irn, ackNo }) => {
    // Format currency
    const formatINR = (val) => {
        const num = parseFloat(val);
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(isNaN(num) ? 0 : num);
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        }).replace(/ /g, '-');
    };

    // Number to words helper
    const numberToWords = (num) => {
        if (num === null || num === undefined || isNaN(num)) return 'Zero';
        num = Math.floor(Math.abs(num));
        if (num > 999999999999) return 'Amount Too Large';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';
        if (num < 20) return ones[num] || 'Zero';
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
        return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };

    const amountInWords = (amt) => {
        if (amt === null || amt === undefined || isNaN(amt)) return '₹ Zero Only';
        amt = Math.abs(amt || 0);
        const rupees = Math.floor(amt);
        const paise = Math.round((amt - rupees) * 100);
        let result = '₹ ' + numberToWords(rupees);
        if (paise > 0) result += ' and ' + numberToWords(paise) + ' Paise';
        result += ' Only';
        return result;
    };

    // Get state info
    const getStateInfo = (code) => {
        const states = {
            '27': 'Maharashtra', '33': 'Tamil Nadu', '29': 'Karnataka',
            '07': 'Delhi', '24': 'Gujarat', '36': 'Telangana',
            '32': 'Kerala', '19': 'West Bengal'
        };
        return { name: states[code] || 'State', code: code || '00' };
    };

    const supplierState = getStateInfo(data.supplierState);
    const buyerState = getStateInfo(data.recipientState);

    const items = data.items || [];
    const totals = data.totals || { taxableValue: 0, cgst: 0, sgst: 0, invoiceTotal: 0 };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header - Simplified */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tax Invoice</Text>
                </View>

                {/* IRN Details */}
                {irn && (
                    <View style={styles.irnSection}>
                        <View style={styles.irnRow}>
                            <Text style={styles.irnLabel}>IRN:</Text>
                            <Text style={styles.irnValue}>{irn}</Text>
                        </View>
                        <View style={styles.irnRow}>
                            <Text style={styles.irnLabel}>Ack No.:</Text>
                            <Text style={styles.irnValue}>{ackNo || '---'}</Text>
                        </View>
                        <View style={styles.irnRow}>
                            <Text style={styles.irnLabel}>Ack Date:</Text>
                            <Text style={styles.irnValue}>{formatDate(data.invoiceDate)}</Text>
                        </View>
                    </View>
                )}

                {/* Main Details Table */}
                <View style={styles.table}>
                    {/* Supplier & Reference Details Row */}
                    <View style={styles.tableRow}>
                        {/* LEFT: Supplier Section */}
                        <View style={[styles.tableCell, { width: '40%', minHeight: 80 }]}>
                            <View style={styles.supplierSection}>
                                <Text style={styles.supplierName}>{data.supplierName || 'Your Company'}</Text>
                                <Text style={styles.supplierText}>VAT No. : {data.supplierGstin || '---'}</Text>
                            </View>
                        </View>

                        {/* RIGHT: 3-Column Reference Grid */}
                        <View style={{ width: '60%' }}>
                            {/* Row 1: Invoice No., e-Inv No., Dated */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Invoice No.</Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>e-Inv No.</Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Dated</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text style={styles.metadataValue}>{data.invoiceNumber || '---'}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.eInvoiceNo || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{formatDate(data.invoiceDate)}</Text>
                                </View>
                            </View>

                            {/* Row 2: Delivery Note, (blank), Mode/Terms of Payment */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Delivery Note</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Mode/Terms of Payment</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.deliveryNote || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.modeOfPayment || ''}</Text>
                                </View>
                            </View>

                            {/* Row 3: Supplier's Ref., (blank), Other Reference(s) */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Supplier's Ref.</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Other Reference(s)</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.supplierRef || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.otherReferences || ''}</Text>
                                </View>
                            </View>

                            {/* Row 4: Buyer's Order No., (blank), Dated */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Buyer's Order No.</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Dated</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.buyerOrderNo || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.buyerOrderDate ? formatDate(data.buyerOrderDate) : ''}</Text>
                                </View>
                            </View>

                            {/* Row 5: Dispatch Document No., (blank), Delivery Note Date */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Despatch Document No.</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Delivery Note Date</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.dispatchDocNo || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.deliveryNoteDate ? formatDate(data.deliveryNoteDate) : ''}</Text>
                                </View>
                            </View>

                            {/* Row 6: Despatched through, (blank), Destination */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Despatched through</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCellHeader, { width: '33.33%' }]}>
                                    <Text>Destination</Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.despatchedThrough || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text></Text>
                                </View>
                                <View style={[styles.tableCell, { width: '33.33%' }]}>
                                    <Text>{data.destination || ''}</Text>
                                </View>
                            </View>

                            {/* Row 7: Terms of Delivery (full width) */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCellHeader, { width: '100%' }]}>
                                    <Text>Terms of Delivery</Text>
                                </View>
                            </View>
                            <View style={styles.tableRowLast}>
                                <View style={[styles.tableCell, { width: '100%' }]}>
                                    <Text>{data.termsOfDelivery || ''}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Consignee Header Row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableCellHeader, { width: '100%' }]}>
                            <Text>Consignee</Text>
                        </View>
                    </View>

                    {/* Consignee Details Row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableCell, { width: '100%' }]}>
                            <View style={styles.buyerDetails}>
                                <Text style={styles.buyerName}>{data.recipientName || 'Customer'}</Text>
                                <Text style={styles.buyerText}>{data.recipientAddress || 'Address'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Buyer Header */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableCellHeader, { width: '100%' }]}>
                            <Text>Buyer</Text>
                        </View>
                    </View>
                </View>

                {/* Buyer Details (outside main table for cleaner layout) */}
                <View style={[styles.table, { marginTop: 0, borderTop: 0 }]}>
                    <View style={styles.tableRowLast}>
                        <View style={[styles.tableCellLast, { width: '100%' }]}>
                            <View style={styles.buyerDetails}>
                                <Text style={styles.buyerName}>{data.recipientName || 'Customer'}</Text>
                                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                                    <Text style={[styles.buyerText, { width: 90 }]}>Country</Text>
                                    <Text style={styles.buyerText}>: {data.recipientCountry || 'N/A'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={[styles.buyerText, { width: 90 }]}>VAT No.</Text>
                                    <Text style={styles.buyerText}>: {data.recipientGstin || 'N/A'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={[styles.buyerText, { width: 90 }]}>Place of supply</Text>
                                    <Text style={styles.buyerText}>: {data.placeOfSupply || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.itemsTable}>
                    {/* Items Table Header */}
                    <View style={styles.itemsHeader}>
                        <Text style={styles.itemCol1}>Sl</Text>
                        <Text style={styles.itemCol2}>Description of Goods</Text>
                        <Text style={styles.itemCol3}>HSN/SAC</Text>
                        <Text style={styles.itemCol4}>Quantity</Text>
                        <Text style={styles.itemCol5}>Rate</Text>
                        <Text style={styles.itemCol6}>per</Text>
                        <Text style={styles.itemCol7}>VAT %</Text>
                        <Text style={styles.itemCol8}>Amount</Text>
                    </View>

                    {/* Items Rows */}
                    {items.map((item, idx) => (
                        <View key={idx} style={idx === items.length - 1 ? styles.itemsRowLast : styles.itemsRow}>
                            <Text style={styles.itemCol1}>{idx + 1}</Text>
                            <Text style={styles.itemCol2}>{item.product || '---'}</Text>
                            <Text style={styles.itemCol3}>{item.hsn || '---'}</Text>
                            <Text style={styles.itemCol4}>{item.qty || 0} {item.unit || 'Nos'}</Text>
                            <Text style={styles.itemCol5}>{formatINR(item.rate || 0)}</Text>
                            <Text style={styles.itemCol6}>{item.unit || 'Nos'}</Text>
                            <Text style={styles.itemCol7}>{item.gstPercent || 0}%</Text>
                            <Text style={styles.itemCol8}>{formatINR((item.qty || 0) * (item.rate || 0))}</Text>
                        </View>
                    ))}

                    {/* CGST Row */}
                    <View style={styles.itemsRow}>
                        <Text style={styles.itemCol1}></Text>
                        <Text style={[styles.itemCol2, styles.italic, styles.textRight]}>CGST</Text>
                        <Text style={styles.itemCol3}></Text>
                        <Text style={styles.itemCol4}></Text>
                        <Text style={styles.itemCol5}></Text>
                        <Text style={styles.itemCol6}></Text>
                        <Text style={styles.itemCol7}></Text>
                        <Text style={styles.itemCol8}>{formatINR(totals.cgst)}</Text>
                    </View>

                    {/* SGST Row */}
                    <View style={styles.itemsRow}>
                        <Text style={styles.itemCol1}></Text>
                        <Text style={[styles.itemCol2, styles.italic, styles.textRight]}>SGST</Text>
                        <Text style={styles.itemCol3}></Text>
                        <Text style={styles.itemCol4}></Text>
                        <Text style={styles.itemCol5}></Text>
                        <Text style={styles.itemCol6}></Text>
                        <Text style={styles.itemCol7}></Text>
                        <Text style={styles.itemCol8}>{formatINR(totals.sgst)}</Text>
                    </View>

                    {/* Total Row */}
                    <View style={styles.itemsRowLast}>
                        <Text style={styles.itemCol1}></Text>
                        <Text style={[styles.itemCol2, styles.bold, styles.textRight]}>Total</Text>
                        <Text style={styles.itemCol3}></Text>
                        <Text style={styles.itemCol4}></Text>
                        <Text style={styles.itemCol5}></Text>
                        <Text style={styles.itemCol6}></Text>
                        <Text style={styles.itemCol7}></Text>
                        <Text style={[styles.itemCol8, styles.bold, { fontSize: 10 }]}>₹ {formatINR(totals.invoiceTotal)}</Text>
                    </View>
                </View>

                {/* Amount in Words and Totals */}
                <View style={styles.totalsRow}>
                    {/* Amount in Words */}
                    <View style={styles.amountWords}>
                        <Text style={styles.amountWordsLabel}>Amount Chargeable (in words):</Text>
                        <Text style={styles.amountWordsValue}>
                            {amountInWords(parseFloat(totals.invoiceTotal))}
                        </Text>
                    </View>

                    {/* Totals Table */}
                    <View style={styles.totalsTable}>
                        <View style={styles.totalsTableRow}>
                            <Text style={styles.totalsLabel}>Taxable Value</Text>
                            <Text style={styles.totalsValue}>{formatINR(totals.taxableValue)}</Text>
                        </View>
                        <View style={styles.totalsTableRow}>
                            <Text style={styles.totalsLabel}>CGST</Text>
                            <Text style={styles.totalsValue}>{formatINR(totals.cgst)}</Text>
                        </View>
                        <View style={styles.totalsTableRow}>
                            <Text style={styles.totalsLabel}>SGST</Text>
                            <Text style={styles.totalsValue}>{formatINR(totals.sgst)}</Text>
                        </View>
                        <View style={styles.totalsTableRowLast}>
                            <Text style={[styles.totalsLabel, styles.totalsFinal]}>Invoice Total</Text>
                            <Text style={[styles.totalsValue, styles.totalsFinal]}>₹ {formatINR(totals.invoiceTotal)}</Text>
                        </View>
                        <View style={{ paddingTop: 2, textAlign: 'right' }}>
                            <Text style={{ fontSize: 7, fontStyle: 'italic' }}>E & O.E</Text>
                        </View>
                    </View>
                </View>

                {/* Footer - QR and Signature */}
                <View style={styles.footer}>
                    <View style={styles.footerQR}>
                        {qrCode ? (
                            <Image src={qrCode} style={{ width: 80, height: 80 }} />
                        ) : (
                            <View style={{ width: 80, height: 80, backgroundColor: '#F0F0F0' }} />
                        )}
                    </View>
                    <View style={styles.footerSignature}>
                        <Text style={styles.signatureText}>for {data.supplierName || 'Your Company'}</Text>
                        <Text style={styles.signatureLabel}>Authorised Signatory</Text>
                    </View>
                </View>

                {/* Computer Generated */}
                <Text style={styles.computerGenerated}>This is a Computer Generated Invoice</Text>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
