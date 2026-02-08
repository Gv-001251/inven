import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Styles for E-Way Bill
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 9,
        fontFamily: 'Helvetica',
        lineHeight: 1.2,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    section: {
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#000',
    },
    sectionHeader: {
        backgroundColor: '#f0f0f0',
        padding: 4,
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    rowLast: {
        flexDirection: 'row',
    },
    col: {
        padding: 4,
        flexDirection: 'column',
    },
    col50: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    col50Last: {
        width: '50%',
    },
    col33: {
        width: '33.33%',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    col33Last: {
        width: '33.33%',
    },
    label: {
        fontSize: 8,
        color: '#666',
        marginBottom: 2,
    },
    value: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    qrContainer: {
        alignItems: 'center',
        padding: 10,
    },
    qrPlaceholder: {
        width: 80,
        height: 80,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
    },
});

const EWayBillPDF = ({ data, qrCode }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Title */}
                <Text style={styles.title}>E-WAY BILL</Text>

                {/* Section 1: E-Way Bill Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>1. E-WAY BILL Details</Text>
                    <View style={styles.row}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>E-Way Bill Number</Text>
                            <Text style={styles.value}>{data.ewbNumber || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>Generated Date</Text>
                            <Text style={styles.value}>{formatDate(data.generatedDate || new Date())}</Text>
                        </View>
                    </View>
                    <View style={styles.rowLast}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>Valid Until</Text>
                            <Text style={styles.value}>{formatDate(data.validUntil)}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>IRN</Text>
                            <Text style={styles.value}>{data.irn || '---'}</Text>
                        </View>
                    </View>
                </View>

                {/* Section 2: Address Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>2. Address Details</Text>
                    <View style={styles.row}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>From (Consignor)</Text>
                            <Text style={styles.value}>{data.supplierName || '---'}</Text>
                            <Text style={{ fontSize: 8, marginTop: 2 }}>{data.supplierAddress || ''}</Text>
                            <Text style={{ fontSize: 8 }}>GSTIN: {data.supplierGstin || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>To (Consignee)</Text>
                            <Text style={styles.value}>{data.recipientName || '---'}</Text>
                            <Text style={{ fontSize: 8, marginTop: 2 }}>{data.recipientAddress || ''}</Text>
                            <Text style={{ fontSize: 8 }}>GSTIN: {data.recipientGstin || '---'}</Text>
                        </View>
                    </View>
                    <View style={styles.rowLast}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>Dispatch From</Text>
                            <Text style={styles.value}>{data.dispatchFrom || data.supplierAddress || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>Ship To</Text>
                            <Text style={styles.value}>{data.destination || data.recipientAddress || '---'}</Text>
                        </View>
                    </View>
                </View>

                {/* Section 3: Goods Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>3. Goods Details</Text>
                    <View style={styles.row}>
                        <View style={[styles.col, styles.col33]}>
                            <Text style={styles.label}>Product</Text>
                            <Text style={styles.value}>{data.productDescription || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col33]}>
                            <Text style={styles.label}>HSN Code</Text>
                            <Text style={styles.value}>{data.hsnCode || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col33Last]}>
                            <Text style={styles.label}>Quantity</Text>
                            <Text style={styles.value}>{data.quantity || '0'}</Text>
                        </View>
                    </View>
                    <View style={styles.rowLast}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>Taxable Value</Text>
                            <Text style={styles.value}>₹ {data.taxableValue || '0.00'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>Invoice Value</Text>
                            <Text style={styles.value}>₹ {data.invoiceValue || '0.00'}</Text>
                        </View>
                    </View>
                </View>

                {/* Section 4: Transportation Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>4. Transportation Details</Text>
                    <View style={styles.row}>
                        <View style={[styles.col, styles.col33]}>
                            <Text style={styles.label}>Transporter Name</Text>
                            <Text style={styles.value}>{data.transporterName || data.despatchedThrough || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col33]}>
                            <Text style={styles.label}>Transporter ID</Text>
                            <Text style={styles.value}>{data.transporterId || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col33Last]}>
                            <Text style={styles.label}>Transport Mode</Text>
                            <Text style={styles.value}>{data.transportMode || 'Road'}</Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>Vehicle Number</Text>
                            <Text style={styles.value}>{data.vehicleNumber || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>Approximate Distance (KM)</Text>
                            <Text style={styles.value}>{data.distance || '---'}</Text>
                        </View>
                    </View>
                    <View style={styles.rowLast}>
                        <View style={[styles.col, styles.col50]}>
                            <Text style={styles.label}>Document Number</Text>
                            <Text style={styles.value}>{data.invoiceNumber || '---'}</Text>
                        </View>
                        <View style={[styles.col, styles.col50Last]}>
                            <Text style={styles.label}>Document Date</Text>
                            <Text style={styles.value}>{formatDate(data.invoiceDate)}</Text>
                        </View>
                    </View>
                </View>

                {/* QR Code Section */}
                <View style={styles.section}>
                    <View style={styles.qrContainer}>
                        {qrCode ? (
                            <Image src={qrCode} style={{ width: 80, height: 80 }} />
                        ) : (
                            <View style={styles.qrPlaceholder} />
                        )}
                        <Text style={{ fontSize: 8, marginTop: 4 }}>Scan for verification</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={{ textAlign: 'center', fontSize: 8, marginTop: 10 }}>
                    This is a system-generated E-Way Bill
                </Text>
            </Page>
        </Document>
    );
};

export default EWayBillPDF;
