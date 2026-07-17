import { supabase } from '../lib/supabase';
import type { Company, Product, Order, Customer } from '../types';

/**
 * ARCHITECTURE PREPARATION FOR SUPABASE
 * 
 * This service acts as the data access layer (DAL) decoupled from the UI.
 * Currently, the application uses local mock endpoints in server.ts to allow fast UI development.
 * Once ready to connect to Supabase, you can swap the API calls in Dashboard.tsx and Catalog.tsx
 * to use these Supabase functions.
 */

export const SupabaseService = {
  // --- AUTHENTICATION ---
  
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // --- COMPANIES ---
  
  async getCompanyBySlug(slug: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error) throw error;
    return data as Company;
  },

  async getCompanyByUserId(userId: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) throw error;
    return data as Company;
  },

  // --- PRODUCTS ---
  
  async getProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data as Product[];
  },

  // --- ORDERS ---
  
  async getOrders(companyId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Order[];
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
      
    if (error) throw error;
    return data as Order;
  },

  // --- CUSTOMERS ---
  
  async getCustomers(companyId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data as Customer[];
  },

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
      
    if (error) throw error;
    return data as Customer;
  },

  // --- EXPENSES ---
  
  async getExpenses(companyId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data;
  },

  async createExpense(expenseData: any) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // --- INVENTORY ---
  
  async getInventoryMovements(companyId: string) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data;
  },

  // --- CRM ---
  
  async getCrmDeals(companyId: string) {
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    return data;
  }
};
