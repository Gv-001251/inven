import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Styles matching the reference image layout
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 9,
        fontFamily: 'Helvetica',
        lineHeight: 1.2,
    },
    mainContainer: {
        borderWidth: 1,
        borderColor: '#000',
        flexDirection: 'column',
    },
    headerTitle: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 8,
        textDecoration: 'underline',
    },
    // Generic helpers
    row: { flexDirection: 'row' },
    col: { flexDirection: 'column' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#000' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#000' },
    borderTop: { borderTopWidth: 1, borderTopColor: '#000' },
    bold: { fontFamily: 'Helvetica-Bold' },
    label: { fontSize: 8, color: '#000' },
    value: { fontSize: 9 },

    // Top section (50/50 split)
    topLeft: { width: '35%' },
    topRight: { width: '65%' },

    // Grid for reference details
    gridRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 22,
    },
    gridHalfCol: {
        width: '50%',
        padding: 4,
    },

    // Address blocks
    addressBlock: {
        padding: 6,
        flex: 1,
    },

    // Item table
    tableHeader: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
        minHeight: 18,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 80,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    tableRowLast: {
        flexDirection: 'row',
        minHeight: 80,
    },

    // Item columns
    colSl: { width: '5%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'center' },
    colDesc: { width: '30%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colHsn: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'center' },
    colQty: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'center' },
    colRate: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'right' },
    colPer: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'center' },
    colVat: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, textAlign: 'center' },
    colAmount: { width: '15%', padding: 2, textAlign: 'right' },

    // Totals section
    totalSection: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#000',
    },
    totalLeft: {
        width: '50%',
        padding: 6,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    totalRight: {
        width: '50%',
        flexDirection: 'column',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    finalTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        backgroundColor: '#f0f0f0',
    },

    // Footer
    footerSection: {
        padding: 6,
        minHeight: 60,
        borderTopWidth: 1,
        borderTopColor: '#000',
    },
    signatureSection: {
        flexDirection: 'row',
        minHeight: 80,
        borderTopWidth: 1,
        borderColor: '#000',
    },
    qrContainer: {
        width: '40%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    qrPlaceholder: {
        width: 70,
        height: 70,
        borderWidth: 1,
        borderColor: '#000',
    },
    signatureRight: {
        width: '60%',
        padding: 6,
        justifyContent: 'space-between',
    },
    bottomText: {
        textAlign: 'center',
        fontSize: 8,
        marginTop: 6,
    },
});

// Invoice PDF Component
const InvoicePDF = ({ data, qrCode }) => {
    // Helper functions
    const formatINR = (val) => {
        const num = parseFloat(val);
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(isNaN(num) ? 0 : num);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        }).replace(/ /g, '-');
    };

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

    // Extract data
    const items = data.items || [];
    const totals = data.totals || { taxableValue: 0, cgst: 0, sgst: 0, invoiceTotal: 0 };
    const totalGST = parseFloat(totals.cgst || 0) + parseFloat(totals.sgst || 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header Title */}
                <Text style={styles.headerTitle}>Tax Invoice</Text>

                {/* Main Container */}
                <View style={styles.mainContainer}>

                    {/* TOP SECTION: Split 35/65 */}
                    <View style={[styles.row, styles.borderBottom]}>

                        {/* LEFT COLUMN: Supplier, Consignee, Buyer */}
                        <View style={[styles.col, styles.topLeft, styles.borderRight]}>
                            {/* Supplier */}
                            <View style={[styles.addressBlock, { minHeight: 50, borderBottomWidth: 1, borderColor: '#000' }]}>
                                <Text style={styles.bold}>{data.supplierName || 'Your Company'}</Text>
                                <Text style={{ fontSize: 8 }}>GST No. : {data.supplierGstin || '---'}</Text>
                            </View>

                            {/* Consignee */}
                            <View style={[styles.addressBlock, { minHeight: 45, borderBottomWidth: 1, borderColor: '#000' }]}>
                                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Consignee</Text>
                                <Text style={styles.bold}>{data.recipientName || 'Customer'}</Text>
                            </View>

                            {/* Buyer */}
                            <View style={[styles.addressBlock, { minHeight: 80 }]}>
                                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Buyer</Text>
                                <Text style={styles.bold}>{data.recipientName || 'Customer'}</Text>
                                <View style={{ marginTop: 6 }}>
                                    <Text style={{ fontSize: 8 }}>Country              : {data.recipientCountry || ''}</Text>
                                    <Text style={{ fontSize: 8 }}>GST No.             : {data.recipientGstin || ''}</Text>
                                    <Text style={{ fontSize: 8 }}>Place of supply  : {data.placeOfSupply || ''}</Text>
                                </View>
                            </View>
                        </View>

                        {/* RIGHT COLUMN: Reference Grid (2-column 50/50) */}
                        <View style={[styles.col, styles.topRight]}>
                            {/* Row 1: Invoice No / Dated */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Invoice No.</Text>
                                    <Text style={styles.bold}>{data.invoiceNumber || '---'}</Text>
                                    <Text style={{ fontSize: 7, marginTop: 2 }}>e-Inv No.: {data.eInvoiceNo || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Dated</Text>
                                    <Text style={styles.bold}>{formatDate(data.invoiceDate)}</Text>
                                </View>
                            </View>

                            {/* Row 2: Delivery Note / Mode of Payment */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Delivery Note</Text>
                                    <Text>{data.deliveryNote || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Mode/Terms of Payment</Text>
                                    <Text>{data.modeOfPayment || ''}</Text>
                                </View>
                            </View>

                            {/* Row 3: Supplier's Ref / Other References */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Supplier's Ref.</Text>
                                    <Text>{data.supplierRef || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Other Reference(s)</Text>
                                    <Text>{data.otherReferences || ''}</Text>
                                </View>
                            </View>

                            {/* Row 4: Buyer's Order No / Dated */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Buyer's Order No.</Text>
                                    <Text>{data.buyerOrderNo || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Dated</Text>
                                    <Text>{data.buyerOrderDate ? formatDate(data.buyerOrderDate) : ''}</Text>
                                </View>
                            </View>

                            {/* Row 5: Despatch Document No / Delivery Note Date */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Despatch Document No.</Text>
                                    <Text>{data.dispatchDocNo || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Delivery Note Date</Text>
                                    <Text>{data.deliveryNoteDate ? formatDate(data.deliveryNoteDate) : ''}</Text>
                                </View>
                            </View>

                            {/* Row 6: Despatched through / Destination */}
                            <View style={styles.gridRow}>
                                <View style={[styles.gridHalfCol, styles.borderRight]}>
                                    <Text style={styles.label}>Despatched through</Text>
                                    <Text>{data.despatchedThrough || ''}</Text>
                                </View>
                                <View style={styles.gridHalfCol}>
                                    <Text style={styles.label}>Destination</Text>
                                    <Text>{data.destination || ''}</Text>
                                </View>
                            </View>

                            {/* Row 7: Terms of Delivery (full width) */}
                            <View style={{ padding: 4, minHeight: 50, borderBottomWidth: 1, borderBottomColor: '#000' }}>
                                <Text style={styles.label}>Terms of Delivery</Text>
                                <Text>{data.termsOfDelivery || ''}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ITEM TABLE HEADER */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colSl, styles.bold]}>Sl No.</Text>
                        <Text style={[styles.colDesc, styles.bold]}>Description of Goods</Text>
                        <Text style={[styles.colHsn, styles.bold]}>HSN/SAC</Text>
                        <Text style={[styles.colQty, styles.bold]}>Quantity</Text>
                        <Text style={[styles.colRate, styles.bold]}>Rate</Text>
                        <Text style={[styles.colPer, styles.bold]}>per</Text>
                        <Text style={[styles.colVat, styles.bold]}>GST %</Text>
                        <Text style={[styles.colAmount, styles.bold]}>Amount</Text>
                    </View>

                    {/* ITEM TABLE ROWS */}
                    {items.map((item, index) => (
                        <View key={index} style={index === items.length - 1 ? styles.tableRowLast : styles.tableRow}>
                            <Text style={[styles.colSl, { paddingTop: 6 }]}>{index + 1}</Text>
                            <Text style={[styles.colDesc, styles.bold, { paddingTop: 6 }]}>{item.product || '---'}</Text>
                            <Text style={[styles.colHsn, { paddingTop: 6 }]}>{item.hsn || '---'}</Text>
                            <Text style={[styles.colQty, styles.bold, { paddingTop: 6 }]}>{item.qty || 0} {item.unit || 'Nos'}</Text>
                            <Text style={[styles.colRate, { paddingTop: 6 }]}>{formatINR(item.rate || 0)}</Text>
                            <Text style={[styles.colPer, { paddingTop: 6 }]}>{item.unit || 'Nos'}</Text>
                            <Text style={[styles.colVat, { paddingTop: 6 }]}>{item.gstPercent || 0}%</Text>
                            <Text style={[styles.colAmount, styles.bold, { paddingTop: 6 }]}>{formatINR((item.qty || 0) * (item.rate || 0))}</Text>
                        </View>
                    ))}

                    {/* TOTALS SECTION */}
                    <View style={styles.totalSection}>
                        {/* Left: Amount in Words */}
                        <View style={styles.totalLeft}>
                            <Text style={styles.label}>Amount Chargeable (in words)</Text>
                            <Text style={[styles.bold, { marginTop: 3, marginBottom: 6, fontSize: 9 }]}>
                                {amountInWords(parseFloat(totals.invoiceTotal))}
                            </Text>

                            <Text style={styles.label}>GST Amount (in words)</Text>
                            <Text style={[styles.bold, { marginTop: 3, fontSize: 9 }]}>
                                {amountInWords(totalGST)}
                            </Text>
                        </View>

                        {/* Right: Calculations */}
                        <View style={styles.totalRight}>
                            <View style={styles.totalRow}>
                                <Text>Taxable Value</Text>
                                <Text style={styles.bold}>{formatINR(totals.taxableValue)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text>Goods and Services Tax 15 %</Text>
                                <Text style={styles.bold}>{formatINR(totalGST)}</Text>
                            </View>
                            <View style={styles.finalTotal}>
                                <Text style={[styles.bold, { fontSize: 10 }]}>Invoice Total</Text>
                                <Text style={[styles.bold, { fontSize: 10 }]}>{formatINR(totals.invoiceTotal)}</Text>
                            </View>
                            <Text style={{ textAlign: 'right', fontSize: 7, paddingRight: 4, paddingTop: 2, fontStyle: 'italic' }}>E. & O.E</Text>
                        </View>
                    </View>

                    {/* FOOTER: Declaration */}
                    <View style={styles.footerSection}>
                        <Text style={[styles.label, { textDecoration: 'underline', fontFamily: 'Helvetica-Bold' }]}>Declaration</Text>
                        <Text style={{ fontSize: 7, marginTop: 2 }}>
                            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                        </Text>
                    </View>

                    {/* SIGNATURE SECTION */}
                    <View style={styles.signatureSection}>
                        {/* QR Code */}
                        <View style={styles.qrContainer}>
                            {qrCode ? (
                                <Image src={qrCode} style={{ width: 70, height: 70 }} />
                            ) : (
                                <View style={styles.qrPlaceholder} />
                            )}
                            <Text style={{ fontSize: 7, marginLeft: 4 }}>Customer's Seal{'\n'}and Signature</Text>
                        </View>

                        {/* Signature */}
                        <View style={styles.signatureRight}>
                            <Text style={[styles.bold, { textAlign: 'right', fontSize: 9 }]}>for {data.supplierName || 'Your Company'}</Text>
                            <Text style={{ textAlign: 'right', fontSize: 8, marginTop: 40 }}>Authorised Signatory</Text>
                        </View>
                    </View>

                </View>

                {/* Bottom Text */}
                <Text style={styles.bottomText}>This is a Computer Generated Invoice</Text>

            </Page>
        </Document>
    );
};

export default InvoicePDF;
