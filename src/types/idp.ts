// IDP (Intelligent Document Processing) Types

export interface IDPFieldMapping {
  id: string;
  pdfFieldId: string;
  pdfFieldName: string;
  pdfFieldBounds: PDFFieldBounds;
  jsonPath: string;
  jsonKey: string;
  fieldType: 'text' | 'number' | 'date' | 'checkbox' | 'signature' | 'image';
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: ValidationRule[];
}

export interface PDFFieldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';
  value?: string | number;
  message: string;
}

export interface IDPConfiguration {
  samplePdfUrl: string;
  samplePdfFileName: string;
  jsonStructure: Record<string, unknown>;
  apiEndpoint: string;
  authCredentials: IDPAuthCredentials;
  fieldMappings: IDPFieldMapping[];
  processingOptions?: IDPProcessingOptions;
}

export interface IDPAuthCredentials {
  type: 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  oauth2Config?: OAuth2Config;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
}

export interface IDPProcessingOptions {
  ocrEnabled: boolean;
  autoFieldDetection: boolean;
  confidenceThreshold: number;
  outputFormat: 'json' | 'xml' | 'csv';
}

export interface IDPDynamicConfig {
  sample_pdf_url?: string;
  sample_pdf_file_name?: string;
  json_structure?: string;
  api_endpoint?: string;
  auth_type?: string;
  auth_credentials?: string;
  field_mappings?: string;
  processing_options?: string;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  imageUrl?: string;
}

export interface PDFDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  pageCount: number;
  pages: PDFPage[];
  uploadedAt: string;
}

export interface SelectedPDFField {
  id: string;
  name: string;
  bounds: PDFFieldBounds;
  linkedJsonKey?: string;
  fieldType: IDPFieldMapping['fieldType'];
}

export interface JSONStructureNode {
  key: string;
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  children?: JSONStructureNode[];
  linkedPdfFieldId?: string;
}

// API Request/Response types
export interface CreateIDPConfigRequest {
  agent_id: string;
  sample_pdf: File;
  json_structure: string;
  api_endpoint: string;
  auth_credentials: IDPAuthCredentials;
}

export interface UpdateIDPConfigRequest {
  field_mappings?: IDPFieldMapping[];
  api_endpoint?: string;
  auth_credentials?: IDPAuthCredentials;
  processing_options?: IDPProcessingOptions;
}

export interface IDPConfigResponse {
  id: string;
  agent_id: string;
  configuration: IDPConfiguration;
  created_at: string;
  updated_at: string;
}

export interface ProcessDocumentRequest {
  document: File;
  use_ocr?: boolean;
  apply_mappings?: boolean;
}

export interface ProcessDocumentResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  extracted_data?: Record<string, unknown>;
  mapped_data?: Record<string, unknown>;
  confidence_scores?: Record<string, number>;
  errors?: string[];
  processing_time_ms?: number;
}
