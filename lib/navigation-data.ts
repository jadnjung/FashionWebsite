// PLACEHOLDER navigation structure — PROJECT.md §9, §11.
// Replaced by real Shopify collection/category data in ROADMAP.md
// Phase 2. This is the only file in the shell layer that holds
// commerce-adjacent placeholder data.

export interface NavCategory {
  label: string;
  href: string;
  subcategories?: { label: string; href: string }[];
}

export const NAVIGATION: NavCategory[] = [
  { label: 'NEW', href: '/new' },
  {
    label: 'TOPS',
    href: '/tops',
    subcategories: [
      { label: 'T-Shirts', href: '/tops/t-shirts' },
      { label: 'Shirts', href: '/tops/shirts' },
      { label: 'Hoodies', href: '/tops/hoodies' },
      { label: 'Sweaters', href: '/tops/sweaters' },
      { label: 'Jackets', href: '/tops/jackets' },
    ],
  },
  {
    label: 'BOTTOMS',
    href: '/bottoms',
    subcategories: [
      { label: 'Jeans', href: '/bottoms/jeans' },
      { label: 'Trousers', href: '/bottoms/trousers' },
      { label: 'Shorts', href: '/bottoms/shorts' },
      { label: 'Sweatpants', href: '/bottoms/sweatpants' },
    ],
  },
  {
    label: 'ETC.',
    href: '/etc',
    subcategories: [
      { label: 'Hats', href: '/etc/hats' },
      { label: 'Jewelry', href: '/etc/jewelry' },
    ],
  },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'ABOUT', href: '/about' },
];
