-- Create einvoice_records table for E-Invoice and E-Way Bill functionality
-- Run this SQL in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS einvoice_records (
    id UUID PRIMARY KEY,
    invoice_type VARCHAR(20),
    invoice_number VARCHAR(50),
    invoice_date DATE,
    supplier_name VARCHAR(255),
    supplier_gstin VARCHAR(15),
    recipient_name VARCHAR(255),
    recipient_gstin VARCHAR(15),
    total_amount DECIMAL(15,2),
    taxable_amount DECIMAL(15,2),
    cgst DECIMAL(15,2),
    sgst DECIMAL(15,2),
    igst DECIMAL(15,2),
    irn TEXT,
    qrcode TEXT,
    signed_invoice TEXT,
    status VARCHAR(20) DEFAULT 'generated',
    items JSONB,
    ewb_no VARCHAR(50),
    ewb_valid_from TIMESTAMP,
    ewb_valid_upto TIMESTAMP,
    ewb_qrcode TEXT,
    ewb_distance INTEGER,
    ewb_vehicle_no VARCHAR(20),
    ewb_transporter_id VARCHAR(50),
    ewb_transporter_name VARCHAR(255),
    ewb_transporter_gstin VARCHAR(15),
    ewb_status VARCHAR(20),
    ewb_generated_at TIMESTAMP,
    ewb_generated_by UUID,
    generated_by UUID,
    generated_by_name VARCHAR(255),
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE einvoice_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to access
CREATE POLICY "Allow authenticated users full access" ON einvoice_records
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON einvoice_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_einvoice_records_supplier_gstin ON einvoice_records(supplier_gstin);
CREATE INDEX IF NOT EXISTS idx_einvoice_records_status ON einvoice_records(status);
CREATE INDEX IF NOT EXISTS idx_einvoice_records_created_at ON einvoice_records(created_at);
CREATE INDEX IF NOT EXISTS idx_einvoice_records_irn ON einvoice_records(irn);
