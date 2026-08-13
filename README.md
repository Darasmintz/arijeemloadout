# Arijeem Multi-Purpose - Loadout Order Management System

A simple, fast, and professional web-based Loadout Order Management System for Arijeem Multi-Purpose.

## Features

- **Fast Order Entry**: Select products, enter quantities, and automatic calculations
- **Automatic Order Numbers**: Unique order numbers generated with format YYMMDD + COMPANY ID + Serial
- **Receipt Generation**: Professional receipts with barcode
- **Order History**: Search and view past orders
- **Product Management**: Add, edit, and manage products
- **Preseller Management**: Add, edit, and manage loadout presellers
- **Dashboard**: View today's orders and sales
- **Responsive Design**: Works on desktop and mobile devices
- **Print-Ready Receipts**: Dedicated print stylesheet for professional receipts

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: Supabase (PostgreSQL)
- **Barcode Generation**: JsBarcode (CDN)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be ready (usually 1-2 minutes)

### 2. Run the Database Schema

1. In your Supabase project dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema
5. This will create all necessary tables and functions

### 3. Configure the Application

1. Open `script.js` in a text editor
2. Replace the following placeholders with your Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

To get your credentials:
- In Supabase dashboard, go to **Settings** → **API**
- Copy the **Project URL** and paste it as `SUPABASE_URL`
- Copy the **anon/public** key and paste it as `SUPABASE_ANON_KEY`

### 4. Run the Application

Simply open `index.html` in a web browser.

For local development, you can use a simple HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

## Usage

### Creating a New Order

1. Click **+ NEW ORDER** in the sidebar
2. Select a Loadout Preseller from the dropdown
3. Select products and enter quantities
4. Click **+ ADD PRODUCT** to add more products
5. Review the automatic calculations
6. Click **GENERATE ORDER & RECEIPT**
7. View and print the receipt

### Managing Products

1. Go to **Products** in the sidebar
2. Click **+ ADD PRODUCT** to add new products
3. Use the **Edit** button to modify product details
4. Use **Activate/Deactivate** to control product availability

### Managing Presellers

1. Go to **Presellers** in the sidebar
2. Click **+ ADD PRESELLER** to add new presellers
3. Names are automatically converted to uppercase
4. Use the **Edit** button to modify preseller details
5. Use **Activate/Deactivate** to control preseller availability

### Viewing Order History

1. Go to **Orders** in the sidebar
2. Use the search box to find orders by number, preseller, or date
3. Click **View** to see order details and receipt
4. Click **Print** to print the receipt

## Database Schema

### Tables

- **products**: Stores product information (name, price, active status)
- **presellers**: Stores preseller information (name, active status)
- **orders**: Stores order information (order number, totals, dates)
- **order_items**: Stores individual items in each order (with price snapshots)
- **order_counter**: Tracks the current serial number for order generation

### Order Number Format

Format: `YYMMDD + COMPANY ID + 4-DIGIT SERIAL`

Example: `26081322530001`

- `26` = Year (2026)
- `08` = Month (August)
- `13` = Day
- `2253` = Company ID
- `0001` = Serial number

## Default Values

- **Payment Mode**: TRANSFER
- **Delivery Fee**: ₦100
- **Cashier Name**: Funmi Arijeem
- **Outstanding Balance**: NGN0.00
- **Company ID**: 2253

## Default Products

- Pepsi Pet 60cl - ₦4,300
- Pepsi RGB 50cl - ₦5,600
- 7up RGB 35cl - ₦3,100
- Kommando 30cl - ₦3,100
- Kommando 50cl - ₦4,250
- Kommando RGB - ₦3,220

## Default Presellers

- LOADOUT AYOMIDE
- LOADOUT MRS BISI
- LOADOUT HELEN
- LOADOUT MR SUNDAY
- LOADOUT MRS TOLU
- LOADOUT MISS WUNMI
- LOADOUT MRS BUNMI
- LOADOUT HAWAU
- LOADOUT FATIMOT
- LOADOUT CONFIDENCE
- LOADOUT TIMILEYIN
- LOADOUT MRS KEMI
- LOADOUT OMOLARA
- LOADOUT ESTHER

## Security Notes

- The application uses Supabase Row Level Security (RLS)
- Only the public/anon key is exposed in the frontend
- Administrative functions (editing prices, managing products/presellers) should be restricted to authorized users in production
- Consider implementing authentication for production use

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Troubleshooting

### Orders not saving

- Check that Supabase URL and Anon Key are correctly configured
- Verify the database schema has been executed
- Check browser console for error messages

### Barcode not displaying

- Ensure JsBarcode CDN is accessible
- Check browser console for JavaScript errors

### Print not working correctly

- Ensure print stylesheet is loaded
- Check browser print preview settings

## Support

For issues or questions, please contact the system administrator.

## License

Internal use for Arijeem Multi-Purpose.
