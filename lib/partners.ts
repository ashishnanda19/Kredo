/**
 * Campus-vendor tiles for the landing partners wall (F10). Vendor names are FICTIONAL and typical of Indian
 * college campuses; none of these businesses is a partner. Photos are real Indian street and campus vendors
 * from Wikimedia Commons under the licences below (resized), credited on the page.
 * Order was shuffled once and is fixed so server and client render the same thing.
 */
export interface CampusVendorTile {
  slug: string;
  name: string;
  kind: string;
  /** CSS object-position, to keep the subject in frame */
  focus?: string;
  photo: { author: string; license: string; source: string };
}

const LICENSE_URL: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};
export const licenseUrl = (l: string) => LICENSE_URL[l];

const C = "https://commons.wikimedia.org/wiki/File:";

export const CAMPUS_VENDOR_TILES: CampusVendorTile[] = [
  { slug: "dosa", name: "Udupi Dosa Cart", kind: "Dosa and idli", photo: { author: "Sumasa", license: "CC BY-SA 4.0", source: `${C}Wayside_Food-3.jpg` } },
  { slug: "xerox", name: "Gate 2 Xerox", kind: "Print and binding", photo: { author: "Adrian Sulc", license: "CC BY-SA 3.0", source: `${C}Xerox_stand_in_Mumbai.jpg` } },
  { slug: "tea-stall", name: "Anna Tea Stall", kind: "Chai and snacks", photo: { author: "Karthickbala", license: "CC BY-SA 3.0", source: `${C}Tea_stall_tamil_nadu.jpg` } },
  { slug: "book-depot", name: "Campus Book Depot", kind: "Books and guides", photo: { author: "Fredericknoronha", license: "CC BY-SA 4.0", source: `${C}Bookshop_in_Panjim,_Goa,_India_(Broadway)_--002.jpg` } },
  { slug: "sugarcane-juice", name: "Ganna Ras Corner", kind: "Sugarcane juice", photo: { author: "Vidurmayor", license: "CC BY-SA 4.0", source: `${C}Sugarcane_Juice_Stall.jpg` } },
  { slug: "canteen", name: "Main Block Canteen", kind: "Meals and thali", focus: "30% 50%", photo: { author: "Biswarup Ganguly", license: "CC BY 3.0", source: `${C}Canteen_-_Block_8_-_Chandigarh_Group_of_Colleges_-_Landran_-_Mohali_2016-08-06_8247.JPG` } },
  { slug: "pani-puri", name: "Golgappa Junction", kind: "Pani puri and chaat", photo: { author: "Biswarup Ganguly", license: "CC BY 3.0", source: `${C}Pani_Puri_Stall_-_Kolkata_2013-10-11_3268.JPG` } },
  { slug: "stationers", name: "Vidya Stationers", kind: "Stationery", photo: { author: "Subhashish Panigrahi (psubhashish)", license: "CC BY-SA 3.0", source: `${C}Hindi_notations_on_products,_stationery_shop,_Delhi.jpeg` } },
  { slug: "hakka-noodles", name: "Hostel Hakka Point", kind: "Noodles and chowmein", photo: { author: "Shockv1", license: "CC BY-SA 4.0", source: `${C}Hakka_noodles_combo-roadside_stall-Dacre%27s_lane-West_Bengal-01.jpg` } },
  { slug: "ironing", name: "Hostel Istri Wala", kind: "Laundry and ironing", focus: "50% 40%", photo: { author: "Jorge Royan", license: "CC BY-SA 3.0", source: `${C}India_-_Varanasi_laundry_and_ironing_shop_-_0215.jpg` } },
  { slug: "chai-point", name: "Sharma Chai Point", kind: "Chai and bun maska", focus: "50% 30%", photo: { author: "Yusuke Kawasaki", license: "CC BY 2.0", source: `${C}Street_tea-stall_in_Varanasi.jpg` } },
  { slug: "fruit-stall", name: "Fresh Fruit Stall", kind: "Fruit and fruit chaat", photo: { author: "Jorge Royan", license: "CC BY-SA 3.0", source: `${C}India_-_Fruit_stall_-_7170.jpg` } },
];
