export type MerchKind = 'clothing' | 'accessories' | 'prints';

const apparel = ['S', 'M', 'L', 'XL', 'XXL'];
const one = ['one'];
const phone = ['13', '14', '15'];

export interface MerchItem {
  id: string;
  kind: MerchKind;
  nameKey: string;
  infoKey: string;
  detailKey: string;
  priceSek: number;
  image: string;
  sizes: string[];
}

export function lineKey(id: string, size: string) {
  return `${id}::${size}`;
}

export const MERCH: MerchItem[] = [
  { id: 'cap-graphite', kind: 'clothing', nameKey: 'site.capGraphite', infoKey: 'site.capInfo', detailKey: 'site.capDetail', priceSek: 299, image: '/merch/07.jpg', sizes: one },
  { id: 'tee-ivory', kind: 'clothing', nameKey: 'site.teeIvory', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/02.jpg', sizes: apparel },
  { id: 'tee-graphite', kind: 'clothing', nameKey: 'site.teeGraphite', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/10.jpg', sizes: apparel },
  { id: 'tee-orange', kind: 'clothing', nameKey: 'site.teeOrange', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/12.jpg', sizes: apparel },
  { id: 'hoodie-ivory', kind: 'clothing', nameKey: 'site.hoodieIvory', infoKey: 'site.hoodieInfo', detailKey: 'site.hoodieDetail', priceSek: 699, image: '/merch/13.jpg', sizes: apparel },
  { id: 'hoodie-graphite', kind: 'clothing', nameKey: 'site.hoodieGraphite', infoKey: 'site.hoodieInfo', detailKey: 'site.hoodieDetail', priceSek: 699, image: '/merch/09.jpg', sizes: apparel },
  { id: 'sweat-ivory', kind: 'clothing', nameKey: 'site.sweatIvory', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/15.jpg', sizes: apparel },
  { id: 'sweat-orange', kind: 'clothing', nameKey: 'site.sweatOrange', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/03.jpg', sizes: apparel },
  { id: 'sweat-graphite', kind: 'clothing', nameKey: 'site.sweatGraphite', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/06.jpg', sizes: apparel },
  { id: 'beanie-orange', kind: 'clothing', nameKey: 'site.beanieOrange', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/01.jpg', sizes: one },
  { id: 'beanie-graphite', kind: 'clothing', nameKey: 'site.beanieGraphite', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/04.jpg', sizes: one },
  { id: 'beanie-ivory', kind: 'clothing', nameKey: 'site.beanieIvory', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/14.jpg', sizes: one },
  { id: 'tote-ivory', kind: 'accessories', nameKey: 'site.toteIvory', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/08.jpg', sizes: one },
  { id: 'tote-orange', kind: 'accessories', nameKey: 'site.toteOrange', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/05.jpg', sizes: one },
  { id: 'tote-graphite', kind: 'accessories', nameKey: 'site.toteGraphite', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/11.jpg', sizes: one },
  { id: 'case', kind: 'accessories', nameKey: 'site.case', infoKey: 'site.caseInfo', detailKey: 'site.caseDetail', priceSek: 349, image: '/merch/17.jpg', sizes: phone },
  { id: 'print', kind: 'prints', nameKey: 'site.print', infoKey: 'site.printInfo', detailKey: 'site.printDetail', priceSek: 599, image: '/merch/18.jpg', sizes: one },
  { id: 'stickers', kind: 'prints', nameKey: 'site.stickers', infoKey: 'site.stickersInfo', detailKey: 'site.stickerDetail', priceSek: 149, image: '/merch/16.jpg', sizes: one }
];
