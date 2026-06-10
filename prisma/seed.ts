import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'
import { getMaterialImages } from '../lib/materialImages'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const companies = [
  { name: 'Great Lakes Scrap & Salvage', slug: 'great-lakes-scrap', businessType: 'SCRAP_YARD', city: 'Detroit', state: 'MI', email: 'sales@greatlakesscrap.com', phone: '(313) 555-0101', verificationStatus: 'VERIFIED', rating: 4.7, reviewCount: 83, description: 'Family-owned scrap yard serving Detroit metro since 1974. Specializing in ferrous and non-ferrous metals.', website: 'https://greatlakesscrap.com' },
  { name: 'Gulf Coast Demolition LLC', slug: 'gulf-coast-demolition', businessType: 'DEMOLITION', city: 'Houston', state: 'TX', email: 'ops@gulfcoastdemolition.com', phone: '(713) 555-0202', verificationStatus: 'VERIFIED', rating: 4.5, reviewCount: 61, description: 'Industrial demolition specialists for petrochemical, refinery, and marine facilities.', website: 'https://gulfcoastdemolition.com' },
  { name: 'Pacific Rim Ship Breaking', slug: 'pacific-rim-shipbreaking', businessType: 'SHIP_BREAKER', city: 'Long Beach', state: 'CA', email: 'parts@pacificrimship.com', phone: '(562) 555-0303', verificationStatus: 'VERIFIED', rating: 4.8, reviewCount: 42, description: 'Ship breaking and marine surplus specialists. Marine diesel engines, propellers, and structural steel.' },
  { name: 'Midwest Industrial Surplus', slug: 'midwest-industrial', businessType: 'TRADER', city: 'Chicago', state: 'IL', email: 'buy@midwestindustrial.com', phone: '(312) 555-0404', verificationStatus: 'VERIFIED', rating: 4.6, reviewCount: 128, description: 'Buyers and sellers of industrial surplus, used machinery, and process equipment.' },
  { name: 'Appalachian Recycling Corp', slug: 'appalachian-recycling', businessType: 'RECYCLER', city: 'Pittsburgh', state: 'PA', email: 'contact@appalachianrecycling.com', phone: '(412) 555-0505', verificationStatus: 'VERIFIED', rating: 4.4, reviewCount: 57, description: 'Comprehensive recycling services for industrial metals and e-waste.' },
  { name: 'Southeast Auto Shredder Inc', slug: 'southeast-auto-shredder', businessType: 'SCRAP_YARD', city: 'Atlanta', state: 'GA', email: 'ops@seautoshredder.com', phone: '(404) 555-0606', verificationStatus: 'PENDING', rating: 4.1, reviewCount: 29 },
  { name: 'Rocky Mountain Scrap Metals', slug: 'rocky-mountain-scrap', businessType: 'SCRAP_YARD', city: 'Denver', state: 'CO', email: 'info@rockymountainscrap.com', phone: '(720) 555-0707', verificationStatus: 'VERIFIED', rating: 4.3, reviewCount: 44 },
  { name: 'New England Metal Brokers', slug: 'new-england-metal', businessType: 'BROKER', city: 'Boston', state: 'MA', email: 'deals@nemetals.com', phone: '(617) 555-0808', verificationStatus: 'VERIFIED', rating: 4.9, reviewCount: 201, description: 'Premier metal brokerage serving the Northeast corridor. Ferrous, non-ferrous, and specialty metals.' },
  { name: 'Lone Star Salvage & Scrap', slug: 'lone-star-salvage', businessType: 'SCRAP_YARD', city: 'Dallas', state: 'TX', email: 'sales@lonestarscrap.com', phone: '(214) 555-0909', verificationStatus: 'VERIFIED', rating: 4.2, reviewCount: 36 },
  { name: 'Northwest Machine & Metal', slug: 'northwest-machine', businessType: 'MANUFACTURER', city: 'Seattle', state: 'WA', email: 'surplus@nwmachinemet.com', phone: '(206) 555-1010', verificationStatus: 'VERIFIED', rating: 4.6, reviewCount: 72, description: 'Manufacturer selling excess production materials and decommissioned machinery.' },
  { name: 'Carolina Industrial Dismantlers', slug: 'carolina-dismantlers', businessType: 'DEMOLITION', city: 'Charlotte', state: 'NC', email: 'projects@carolinadismantlers.com', phone: '(704) 555-1111', verificationStatus: 'VERIFIED', rating: 4.4, reviewCount: 39 },
  { name: 'Phoenix Copper & Brass', slug: 'phoenix-copper-brass', businessType: 'SCRAP_YARD', city: 'Phoenix', state: 'AZ', email: 'buy@phoenixcopperbr.com', phone: '(602) 555-1212', verificationStatus: 'VERIFIED', rating: 4.7, reviewCount: 89, description: 'Southwest\'s leading copper and brass scrap dealer. Daily buying and selling.' },
  { name: 'Great Plains Recyclers', slug: 'great-plains-recyclers', businessType: 'RECYCLER', city: 'Kansas City', state: 'MO', email: 'ops@greatplainsrecycle.com', phone: '(816) 555-1313', verificationStatus: 'UNVERIFIED', rating: 3.9, reviewCount: 12 },
  { name: 'Tidewater Marine Surplus', slug: 'tidewater-marine', businessType: 'SHIP_BREAKER', city: 'Norfolk', state: 'VA', email: 'sales@tidewatermarine.com', phone: '(757) 555-1414', verificationStatus: 'VERIFIED', rating: 4.5, reviewCount: 53 },
  { name: 'Ohio Valley Metal Exchange', slug: 'ohio-valley-metals', businessType: 'TRADER', city: 'Columbus', state: 'OH', email: 'trade@ovme.com', phone: '(614) 555-1515', verificationStatus: 'VERIFIED', rating: 4.3, reviewCount: 67 },
  { name: 'Florida Scrap & Equipment', slug: 'florida-scrap', businessType: 'SCRAP_YARD', city: 'Miami', state: 'FL', email: 'info@floridascrap.com', phone: '(305) 555-1616', verificationStatus: 'VERIFIED', rating: 4.1, reviewCount: 31 },
  { name: 'Northern Industrial Services', slug: 'northern-industrial', businessType: 'MANUFACTURER', city: 'Minneapolis', state: 'MN', email: 'surplus@northernis.com', phone: '(612) 555-1717', verificationStatus: 'PENDING', rating: 4.0, reviewCount: 18 },
  { name: 'Bayou Country Salvage', slug: 'bayou-salvage', businessType: 'SCRAP_YARD', city: 'New Orleans', state: 'LA', email: 'buy@bayousalvage.com', phone: '(504) 555-1818', verificationStatus: 'VERIFIED', rating: 4.2, reviewCount: 24 },
  { name: 'Tri-State Metals Corp', slug: 'tri-state-metals', businessType: 'TRADER', city: 'Newark', state: 'NJ', email: 'ops@tristatemetals.com', phone: '(973) 555-1919', verificationStatus: 'VERIFIED', rating: 4.6, reviewCount: 94 },
  { name: 'Desert Southwest Scrap', slug: 'desert-sw-scrap', businessType: 'SCRAP_YARD', city: 'Las Vegas', state: 'NV', email: 'sales@desertswscrap.com', phone: '(702) 555-2020', verificationStatus: 'VERIFIED', rating: 4.0, reviewCount: 21 },
]

const listingTemplates = [
  {
    title: '850 Tons HMS 1&2 Mixed Steel — Ready for Immediate Pickup',
    materialCategory: 'FERROUS_METALS', materialSubcategory: 'HMS 1&2', grade: 'ISRI Grade 200/201',
    condition: 'SCRAP_ONLY', quantity: 850, unit: 'TONS', pricePerUnit: 242, negotiable: true,
    listingType: 'SELL', description: 'Heavy melt steel scrap grades 1 and 2. Material is free of dirt and non-metallics. Available in 50-ton minimum loads. Scale tickets provided. Located at our Detroit yard.',
    specs: 'Grade: HMS 1&2 (ISRI 200/201)\nClean, dry material\nFree of Zorba and stainless\nMin order: 50 tons\nLoading: truck or rail',
    city: 'Detroit', state: 'MI', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: '120,000 lbs Bare Bright Copper Wire Scrap — #1 Grade',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: 'Bare Bright Copper', grade: '#1 Bare Bright',
    condition: 'SCRAP_ONLY', quantity: 120000, unit: 'LBS', pricePerUnit: 3.38, negotiable: true,
    listingType: 'SELL', description: 'Clean bare bright copper wire, no insulation, no tinning. Running rod form. Tested at 99.9% purity. Accumulating weekly — consistent supply available.',
    city: 'Chicago', state: 'IL', pickupAvailable: true, deliveryAvailable: true,
  },
  {
    title: 'Caterpillar 3412 Marine Diesel Engine — 635HP Complete',
    materialCategory: 'ENGINES_DRIVETRAIN', materialSubcategory: 'Marine Diesel', grade: 'Cat 3412',
    condition: 'COMPLETE', quantity: 1, unit: 'PIECES', pricePerUnit: 28500, negotiable: true,
    listingType: 'SELL', description: 'Complete Cat 3412 marine diesel engine, 635HP, removed from 85ft commercial fishing vessel during repowering. Engine ran until vessel was retired. Includes gear, freshwater cooled.',
    specs: 'Make/Model: Caterpillar 3412\nHP: 635\nCylinders: V-12\nFuel: Diesel\nCooling: Raw water\nHours: ~8,400 (est)',
    city: 'Long Beach', state: 'CA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'GE 250HP Electric Motor — 480V 3-Phase, Like New Condition',
    materialCategory: 'ELECTRIC_MOTORS', materialSubcategory: 'AC Induction Motor', grade: 'GE 250HP',
    condition: 'COMPLETE', quantity: 3, unit: 'PIECES', pricePerUnit: 4200, negotiable: false,
    listingType: 'SELL', description: 'Three GE 250HP motors, 480V 3-phase. Removed from conveyor system upgrade. Less than 1,200 hours. All tested and running before removal. Priced to sell quickly.',
    city: 'Pittsburgh', state: 'PA', pickupAvailable: true, deliveryAvailable: true,
  },
  {
    title: '304 Stainless Steel Pipe — 4" Schedule 40, 800 Feet',
    materialCategory: 'PIPING_FITTINGS', materialSubcategory: '304 SS Pipe', grade: '304 Schedule 40',
    condition: 'PARTIAL', quantity: 800, unit: 'PIECES', pricePerUnit: 22, negotiable: true,
    listingType: 'SELL', description: '4" 304 SS pipe, schedule 40, 20-foot lengths. From food processing plant decommission. Some sections have weld marks. Mix of straight and bent sections.',
    city: 'Houston', state: 'TX', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Carbon Steel Storage Tank — 10,000 Gallon, Horizontal',
    materialCategory: 'TANKS_VESSELS', materialSubcategory: 'Horizontal Storage Tank', grade: 'A36 Carbon Steel',
    condition: 'AS_IS', quantity: 2, unit: 'PIECES', pricePerUnit: 8500, negotiable: true,
    listingType: 'SELL', description: '10,000 gallon horizontal carbon steel tank. 12ft diameter, 18ft length. Formerly used for diesel fuel storage. Cleaned and degassed. Buyer responsible for loading.',
    city: 'Dallas', state: 'TX', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'WANTED: 500+ Tons HMS Steel — Paying Premium Prices',
    materialCategory: 'FERROUS_METALS', materialSubcategory: 'HMS 1&2',
    condition: 'SCRAP_ONLY', quantity: 500, unit: 'TONS', pricePerUnit: 248,
    listingType: 'BUY', description: 'Actively buying HMS 1&2 in the Midwest. Paying above market. Can pickup with our trucks. Need consistent monthly supply. Prefer 50+ ton loads.',
    city: 'Chicago', state: 'IL', pickupAvailable: false, deliveryAvailable: false,
  },
  {
    title: 'Waukesha L7042 Natural Gas Engine — Complete with Generator',
    materialCategory: 'ENGINES_DRIVETRAIN', materialSubcategory: 'Natural Gas Engine',
    condition: 'PARTIAL', quantity: 1, unit: 'PIECES', pricePerUnit: 42000, negotiable: true,
    listingType: 'SELL', description: 'Waukesha L7042 6-cylinder natural gas engine with Kato 450kW generator. Complete genset, 15,200 hours. Runs but burning oil. Compression checks available on request. Crated and loaded on flatbed.',
    city: 'Denver', state: 'CO', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: '6" Carbon Steel Pipe — Schedule 80, 2,000+ Feet Available',
    materialCategory: 'PIPING_FITTINGS', materialSubcategory: 'Carbon Steel Pipe', grade: 'A53 Grade B Sch 80',
    condition: 'PARTIAL', quantity: 2000, unit: 'PIECES', pricePerUnit: 18, negotiable: true,
    listingType: 'SELL', description: 'A53 Grade B schedule 80 carbon steel pipe, 6-inch. From refinery turnaround. Mix of new and used sections. Some sections with scale and rust — priced accordingly.',
    city: 'Houston', state: 'TX', pickupAvailable: true, deliveryAvailable: true,
  },
  {
    title: '35-Ton Overhead Bridge Crane — 50ft Span, Ready to Remove',
    materialCategory: 'HEAVY_MACHINERY', materialSubcategory: 'Overhead Crane',
    condition: 'COMPLETE', quantity: 1, unit: 'PIECES', pricePerUnit: 95000, negotiable: true,
    listingType: 'SELL', description: '35-ton double-girder overhead bridge crane, 50ft span, 30ft hook height. Shaw-Box hoist and trolley. Buyer to remove. Will sell components separately if needed.',
    city: 'Detroit', state: 'MI', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Ship Propeller — 5-Blade Bronze, 14ft Diameter',
    materialCategory: 'MARINE_OFFSHORE', materialSubcategory: 'Ship Propeller',
    condition: 'DAMAGED', quantity: 1, unit: 'PIECES', pricePerUnit: 38000, negotiable: true,
    listingType: 'SELL', description: '5-blade manganese bronze propeller, 14ft diameter, from 185ft tug. Two blades have impact damage but no cracks. Weight approx 8.5 tons. Available for inspection in Long Beach.',
    city: 'Long Beach', state: 'CA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Lot of 850 Rail Ties — Hardwood, Removed Railroad',
    materialCategory: 'RAIL_TRANSPORT', materialSubcategory: 'Railroad Ties',
    condition: 'AS_IS', quantity: 850, unit: 'PIECES', pricePerUnit: 12, negotiable: true,
    listingType: 'SELL', description: 'Mixed hardwood railroad ties, mostly oak. Removed from active rail spur. Variable condition from good to heavily weathered. Priced as a lot.',
    city: 'Kansas City', state: 'MO', pickupAvailable: true, deliveryAvailable: true,
  },
  {
    title: '50,000 lbs #1 Copper Bus Bar — Electrical Grade',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: '#1 Copper Bus Bar', grade: '#1 Copper',
    condition: 'SCRAP_ONLY', quantity: 50000, unit: 'LBS', pricePerUnit: 3.15, negotiable: false,
    listingType: 'SELL', description: '#1 copper bus bar from transformer/switchgear decommission. Bare, uncoated. Some pieces have drilled holes. Free of oil and insulation.',
    city: 'Boston', state: 'MA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Stainless Pressure Vessel — 316L, 5,000 Gallon, Code Stamped',
    materialCategory: 'TANKS_VESSELS', materialSubcategory: 'Pressure Vessel', grade: '316L SS',
    condition: 'COMPLETE', quantity: 1, unit: 'PIECES', pricePerUnit: 68000, negotiable: true,
    listingType: 'SELL', description: 'ASME code-stamped 316L stainless steel pressure vessel, 5,000 gallon, rated 150 PSI. Jacketed for heating. 2012 manufacture. Full documentation available.',
    city: 'Houston', state: 'TX', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Aluminum Extrusion Scrap — 6061/6063, 40,000 lbs',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: '6061 Aluminum Extrusion', grade: '6061/6063',
    condition: 'SCRAP_ONLY', quantity: 40000, unit: 'LBS', pricePerUnit: 0.89, negotiable: true,
    listingType: 'SELL', description: 'Clean 6061 and 6063 aluminum extrusion drops from manufacturing facility. Dry, free of iron contamination. Available in bulk. Consistent monthly supply.',
    city: 'Seattle', state: 'WA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'WANTED: Diesel Engine Blocks — All Sizes, Paying Top Dollar',
    materialCategory: 'ENGINES_DRIVETRAIN', materialSubcategory: 'Diesel Engine Blocks',
    condition: 'SCRAP_ONLY', quantity: 100, unit: 'PIECES', pricePerUnit: 0.18,
    listingType: 'WANTED', description: 'Actively buying diesel engine blocks, all makes and sizes — Caterpillar, Detroit Diesel, Cummins, John Deere. Picking up weekly in the Southeast.',
    city: 'Atlanta', state: 'GA', pickupAvailable: false, deliveryAvailable: false,
  },
  {
    title: 'Heat Exchanger — Shell & Tube, CS/SS, 650 sqft Surface Area',
    materialCategory: 'INDUSTRIAL_EQUIPMENT', materialSubcategory: 'Shell & Tube Heat Exchanger',
    condition: 'COMPLETE', quantity: 4, unit: 'PIECES', pricePerUnit: 22000, negotiable: true,
    listingType: 'SELL', description: 'Four shell-and-tube heat exchangers from refinery shutdown. Carbon steel shell, 316SS tubes. 650 sqft effective area each. Last inspection 2021. Minor scale buildup.',
    city: 'Houston', state: 'TX', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Locomotive Parts — Lot of Traction Motors, Frames, Trucks',
    materialCategory: 'RAIL_TRANSPORT', materialSubcategory: 'Locomotive Parts',
    condition: 'PARTIAL', quantity: 1, unit: 'LOT', pricePerUnit: 185000, negotiable: true,
    listingType: 'SELL', description: 'Large lot of EMD SD40-2 parts from 8 retired locomotives: 32 traction motors, 8 trucks, 4 main frames. Some parts serviceable, majority for scrap value.',
    city: 'Columbus', state: 'OH', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Transformer Cores — Silicon Steel, 200+ Tons',
    materialCategory: 'ELECTRIC_MOTORS', materialSubcategory: 'Transformer Core Scrap', grade: 'Silicon Steel',
    condition: 'SCRAP_ONLY', quantity: 200, unit: 'TONS', pricePerUnit: 195, negotiable: true,
    listingType: 'SELL', description: 'Silicon steel transformer core laminations from utility-scale transformer decommission. Clean, free of oil. Stacked and banded on pallets.',
    city: 'Charlotte', state: 'NC', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Lead Acid Battery Scrap — Whole Batteries, 80,000 lbs',
    materialCategory: 'ELECTRONIC_ELECTRICAL', materialSubcategory: 'Lead Acid Battery Scrap',
    condition: 'SCRAP_ONLY', quantity: 80000, unit: 'LBS', pricePerUnit: 0.21, negotiable: false,
    listingType: 'SELL', description: 'Whole lead acid batteries, industrial UPS type. Mixed 12V and 24V. Batteries have been discharged. Proper manifesting provided.',
    city: 'Phoenix', state: 'AZ', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Caterpillar 3516 Engine — 2,500HP for Parts or Scrap',
    materialCategory: 'ENGINES_DRIVETRAIN', materialSubcategory: 'Diesel Engine', grade: 'CAT 3516B',
    condition: 'DAMAGED', quantity: 1, unit: 'PIECES', pricePerUnit: 45000, negotiable: true,
    listingType: 'SELL', description: 'CAT 3516B diesel, 2,500HP. Seized due to oil starvation. Block is good, crankshaft intact. Turbochargers, aftercoolers, and accessories serviceable.',
    city: 'New Orleans', state: 'LA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Structural Steel Beams — W12x65, 40ft Lengths, 300 Tons',
    materialCategory: 'FERROUS_METALS', materialSubcategory: 'Structural Steel Beams', grade: 'W12x65 A36',
    condition: 'PARTIAL', quantity: 300, unit: 'TONS', pricePerUnit: 285, negotiable: true,
    listingType: 'SELL', description: 'W12x65 wide flange beams, A36, mostly 40ft lengths. From industrial building demolition. Some beams have bolt holes and weld marks. Scale and surface rust present.',
    city: 'Newark', state: 'NJ', pickupAvailable: true, deliveryAvailable: true,
  },
  {
    title: 'Copper Wire Scrap — Insulated, #2 Grade, 25,000 lbs',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: 'Insulated Copper Wire', grade: '#2 Insulated Copper',
    condition: 'SCRAP_ONLY', quantity: 25000, unit: 'LBS', pricePerUnit: 1.65, negotiable: true,
    listingType: 'SELL', description: 'Mixed insulated copper wire, predominantly #2 grade. From electrical contractor cleanup. THHN, Romex, and armored cable. Clean, dry, no aluminum.',
    city: 'Miami', state: 'FL', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Aluminum Radiators — Automotive, 15,000 lbs, Whole Units',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: 'Aluminum Radiator',
    condition: 'SCRAP_ONLY', quantity: 15000, unit: 'LBS', pricePerUnit: 0.42, negotiable: false,
    listingType: 'SELL', description: 'Whole automotive aluminum radiators, no steel or plastic end tanks attached. From auto recycler cleanup. Dry, clean. 15,000+ lbs accumulated and ready.',
    city: 'Las Vegas', state: 'NV', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: '10,000 lbs Catalytic Converters — Mid-Grade, Assay Available',
    materialCategory: 'PRECIOUS_SPECIALTY', materialSubcategory: 'Catalytic Converters',
    condition: 'AS_IS', quantity: 10000, unit: 'LBS', pricePerUnit: 28, negotiable: true,
    listingType: 'SELL', description: 'Mixed mid-grade catalytic converters from auto salvage. Independent assay available from 500 lb sample. Price is based on current PGM values. Buyers to verify.',
    city: 'Phoenix', state: 'AZ', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'AUCTION: 200-Ton Overhead Crane — Norcrane, 60ft Span',
    materialCategory: 'HEAVY_MACHINERY', materialSubcategory: 'Overhead Crane',
    condition: 'COMPLETE', quantity: 1, unit: 'PIECES', pricePerUnit: 180000, negotiable: false,
    listingType: 'AUCTION', description: 'Norcrane 200-ton single girder overhead crane, 60ft span, 40ft hook height. Complete with controls and runway rail. Inspection available. Opening bid $180,000.',
    city: 'Minneapolis', state: 'MN', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Aerospace Aluminum — 7075-T6 Sheet and Plate, 8,000 lbs',
    materialCategory: 'AEROSPACE', materialSubcategory: '7075-T6 Aluminum',
    condition: 'PARTIAL', quantity: 8000, unit: 'LBS', pricePerUnit: 1.45, negotiable: true,
    listingType: 'SELL', description: '7075-T6 aluminum sheet and plate drops from aerospace manufacturer. Mixed sizes, some with anodize. Certified material with certs available on most pieces.',
    city: 'Seattle', state: 'WA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Construction Steel — Rebar, Angles, Channel, Mixed 50 Tons',
    materialCategory: 'CONSTRUCTION_DEMOLITION', materialSubcategory: 'Mixed Structural',
    condition: 'SCRAP_ONLY', quantity: 50, unit: 'TONS', pricePerUnit: 210, negotiable: true,
    listingType: 'SELL', description: 'Mixed construction steel from building demo: rebar (various sizes), angle iron, C-channel, tube steel. All cut to manageable lengths under 12ft.',
    city: 'Atlanta', state: 'GA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'E-Waste Lot — Servers, Network Equipment, 40,000 lbs',
    materialCategory: 'ELECTRONIC_ELECTRICAL', materialSubcategory: 'E-Waste / Server Equipment',
    condition: 'AS_IS', quantity: 40000, unit: 'LBS', pricePerUnit: 0.35, negotiable: true,
    listingType: 'SELL', description: 'Data center decommission lot: rack servers, network switches, UPS units, cable trays. Hard drives destroyed (certification available). Mixed ages 2008-2019.',
    city: 'Dallas', state: 'TX', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'Marine Gearbox — Reintjes WAF 361L, Ratio 4.08:1',
    materialCategory: 'MARINE_OFFSHORE', materialSubcategory: 'Marine Gearbox',
    condition: 'COMPLETE', quantity: 1, unit: 'PIECES', pricePerUnit: 55000, negotiable: true,
    listingType: 'SELL', description: 'Reintjes WAF 361L marine reduction gearbox, ratio 4.08:1, continuous 900HP input rating. Removed from vessel refit. Complete with coupling and SAE adapter. Excellent condition.',
    city: 'Norfolk', state: 'VA', pickupAvailable: true, deliveryAvailable: false,
  },
  {
    title: 'BUY REQUEST: 304 SS Scrap Any Form — Need 20 Tons Monthly',
    materialCategory: 'NON_FERROUS_METALS', materialSubcategory: '304 Stainless Scrap',
    condition: 'SCRAP_ONLY', quantity: 20, unit: 'TONS', pricePerUnit: 0.62,
    listingType: 'BUY', description: 'Consistent buyer of 304 stainless steel scrap in any form. Turnings, solids, mixed SS also considered. Pickup available in New England or freight paid to our facility.',
    city: 'Boston', state: 'MA', pickupAvailable: false, deliveryAvailable: false,
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.inquiry.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.review.deleteMany()
  await prisma.company.deleteMany()

  // Create companies
  const createdCompanies = await Promise.all(
    companies.map(company =>
      prisma.company.create({
        data: {
          ...company,
          businessType: company.businessType as any,
          verificationStatus: company.verificationStatus as any,
          memberSince: new Date(2018 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), 1),
        },
      })
    )
  )

  console.log(`Created ${createdCompanies.length} companies`)

  // Create listings — distribute across companies
  const createdListings = await Promise.all(
    listingTemplates.map((template, i) => {
      const company = createdCompanies[i % createdCompanies.length]
      const daysAgo = Math.floor(Math.random() * 30)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)

      return prisma.listing.create({
        data: {
          ...template,
          companyId: company.id,
          listingType: template.listingType as any,
          materialCategory: template.materialCategory as any,
          condition: template.condition as any,
          unit: template.unit as any,
          status: 'ACTIVE',
          currency: 'USD',
          viewCount: Math.floor(Math.random() * 800) + 10,
          inquiryCount: Math.floor(Math.random() * 40),
          photos: getMaterialImages(template.materialCategory, i, 3),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt,
          updatedAt: createdAt,
        },
      })
    })
  )

  // Add more listings to reach ~100 total
  const extraListings = listingTemplates.slice(0, 70).map((template, i) => {
    const company = createdCompanies[(i + 7) % createdCompanies.length]
    const daysAgo = Math.floor(Math.random() * 60)
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - daysAgo)
    return {
      ...template,
      title: template.title + ` [${company.city}]`,
      companyId: company.id,
      city: company.city,
      state: company.state,
      listingType: template.listingType as any,
      materialCategory: template.materialCategory as any,
      condition: template.condition as any,
      unit: template.unit as any,
      status: 'ACTIVE' as const,
      currency: 'USD',
      viewCount: Math.floor(Math.random() * 500) + 5,
      inquiryCount: Math.floor(Math.random() * 20),
      photos: getMaterialImages(template.materialCategory, i + 100, 3),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt,
      updatedAt: createdAt,
    }
  })

  await prisma.listing.createMany({ data: extraListings })

  console.log(`Created ${createdListings.length + extraListings.length} listings`)
  console.log('Seeding complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
