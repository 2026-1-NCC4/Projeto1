// Tipos baseados no schema real do banco de dados Cannoli

export type UUID = string;
export type ISODateString = string;

// campaign
export interface Campaign {
  id: number;
  segmentid: UUID | null;
  templateid: UUID | null;
  storeid: UUID | null;
  name: string | null;
  description: string | null;
  type: number | null;
  statusend: number | null;
  createdat: ISODateString | null;
  customerid: UUID | null;
  sendat: ISODateString | null;
}

// campaign_order
export interface CampaignOrder {
  id: number;
  campaignid: UUID | null;
  message_id: UUID | null;
  sent_at: ISODateString | null;
  status: number | null;
  order_at: ISODateString | null;
  storeid: UUID | null;
  customerid: UUID | null;
  order_id: UUID | null;
  totalamount: number | null;
}

// customer
export interface Customer {
  id: UUID;
  name: string | null;
  gender: string | null;
  dateofbirth: string | null;
  status: number | null;
  isenriched: boolean | null;
  enrichedat: ISODateString | null;
  enrichedby: string | null;
  createdat: ISODateString | null;
  updatedat: ISODateString | null;
  updatedby: string | null;
  birthmonth: number | null;
  birthday: number | null;
}

// customer_address
export interface CustomerAddress {
  id: UUID;
  customerid: UUID | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  status: number | null;
}

// store
export interface Store {
  id: UUID;
  name: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  status: number | null;
  createdat: ISODateString | null;
}

// store_order
export interface StoreOrder {
  id: UUID;
  storeid: UUID | null;
  customerid: UUID | null;
  scheduledat: ISODateString | null;
  totalamount: number | null;
  subtotalamount: number | null;
  discountamount: number | null;
  taxamount: number | null;
  saleschannel: string | null;
  status: number | null;
  ordertype: string | null;
  createdat: ISODateString | null;
  createdby: string | null;
}

// template
export interface Template {
  id: UUID;
  storeid: UUID | null;
  name: string | null;
  description: string | null;
  createdat: ISODateString | null;
  createdby: string | null;
}

// KPIs do Dashboard
export interface DashboardKPI {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

// Dados para gráficos
export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
}

export interface TimeSeriesData {
  date: string;
  campaigns: number;
  orders: number;
  revenue: number;
}

// Tipos auxiliares para status
export enum CampaignType {
  Email = 0,
  SMS = 1,
  Push = 2,
}

export enum CampaignStatusEnd {
  Draft = 0,
  Scheduled = 1,
  Sent = 2,
  Paused = 3,
  Cancelled = 4,
}

export enum CampaignOrderStatus {
  Pending = 0,
  Sent = 1,
  Delivered = 2,
  Failed = 3,
}

export enum StoreOrderStatus {
  Pending = 0,
  Confirmed = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4,
}

export enum CustomerStatus {
  Active = 0,
  Inactive = 1,
  Blocked = 2,
}