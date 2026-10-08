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
  cta?: string;
  sizes: string[];
}

export function lineKey(id: string, size: string) {
  return `${id}::${size}`;
}

export const MERCH: MerchItem[] = [
  { id: 'cap-graphite', kind: 'clothing', nameKey: 'site.capGraphite', infoKey: 'site.capInfo', detailKey: 'site.capDetail', priceSek: 299, image: '/merch/07.webp', sizes: one },
  { id: 'tee-ivory', kind: 'clothing', nameKey: 'site.teeIvory', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/02.webp', sizes: apparel },
  { id: 'tee-graphite', kind: 'clothing', nameKey: 'site.teeGraphite', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/10.webp', sizes: apparel },
  { id: 'tee-orange', kind: 'clothing', nameKey: 'site.teeOrange', infoKey: 'site.teeInfo', detailKey: 'site.teeDetail', priceSek: 399, image: '/merch/12.webp', sizes: apparel },
  { id: 'hoodie-ivory', kind: 'clothing', nameKey: 'site.hoodieIvory', infoKey: 'site.hoodieInfo', detailKey: 'site.hoodieDetail', priceSek: 699, image: '/merch/13.webp', sizes: apparel },
  { id: 'hoodie-graphite', kind: 'clothing', nameKey: 'site.hoodieGraphite', infoKey: 'site.hoodieInfo', detailKey: 'site.hoodieDetail', priceSek: 699, image: '/merch/09.webp', sizes: apparel },
  { id: 'sweat-ivory', kind: 'clothing', nameKey: 'site.sweatIvory', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/15.webp', sizes: apparel },
  { id: 'sweat-orange', kind: 'clothing', nameKey: 'site.sweatOrange', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/03.webp', sizes: apparel },
  { id: 'sweat-graphite', kind: 'clothing', nameKey: 'site.sweatGraphite', infoKey: 'site.hoodieInfo', detailKey: 'site.sweatDetail', priceSek: 599, image: '/merch/06.webp', sizes: apparel },
  { id: 'beanie-orange', kind: 'clothing', nameKey: 'site.beanieOrange', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/01.webp', sizes: one },
  { id: 'beanie-graphite', kind: 'clothing', nameKey: 'site.beanieGraphite', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/04.webp', sizes: one },
  { id: 'beanie-ivory', kind: 'clothing', nameKey: 'site.beanieIvory', infoKey: 'site.capInfo', detailKey: 'site.beanieDetail', priceSek: 299, image: '/merch/14.webp', sizes: one },
  { id: 'tote-ivory', kind: 'accessories', nameKey: 'site.toteIvory', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/08.webp', sizes: one },
  { id: 'tote-orange', kind: 'accessories', nameKey: 'site.toteOrange', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/05.webp', sizes: one },
  { id: 'tote-graphite', kind: 'accessories', nameKey: 'site.toteGraphite', infoKey: 'site.toteInfo', detailKey: 'site.toteDetail', priceSek: 349, image: '/merch/11.webp', sizes: one },
  { id: 'case', kind: 'accessories', nameKey: 'site.case', infoKey: 'site.caseInfo', detailKey: 'site.caseDetail', priceSek: 349, image: '/merch/17.webp', sizes: phone },
  { id: 'print', kind: 'prints', nameKey: 'site.print', infoKey: 'site.printInfo', detailKey: 'site.printDetail', priceSek: 599, image: '/merch/18.webp', sizes: one },
  { id: 'stickers', kind: 'prints', nameKey: 'site.stickers', infoKey: 'site.stickersInfo', detailKey: 'site.stickerDetail', priceSek: 149, image: '/merch/16.webp', sizes: one },
  { id: 'pencils', kind: 'accessories', nameKey: 'site.pencils', infoKey: 'site.pencilsInfo', detailKey: 'site.pencilsInfo', priceSek: 299, image: '/merch/pencils.webp', cta: '/merch/pencils.webp', sizes: one },
  { id: 'tapes', kind: 'accessories', nameKey: 'site.tapes', infoKey: 'site.tapesInfo', detailKey: 'site.tapesInfo', priceSek: 299, image: '/merch/tapes.webp', cta: '/merch/tapes.webp', sizes: one },
  { id: 'apron', kind: 'accessories', nameKey: 'site.apron', infoKey: 'site.apronInfo', detailKey: 'site.apronInfo', priceSek: 399, image: '/merch/apron.webp', cta: '/merch/apron.webp', sizes: one },
  { id: 'mugs', kind: 'accessories', nameKey: 'site.mugs', infoKey: 'site.mugsInfo', detailKey: 'site.mugsInfo', priceSek: 299, image: '/merch/mugs.webp', cta: '/merch/mugs.webp', sizes: one },
  { id: 'journals', kind: 'accessories', nameKey: 'site.journals', infoKey: 'site.journalsInfo', detailKey: 'site.journalsInfo', priceSek: 299, image: '/merch/journals.webp', cta: '/merch/journals.webp', sizes: one },
  { id: 'plaques', kind: 'accessories', nameKey: 'site.plaques', infoKey: 'site.plaquesInfo', detailKey: 'site.plaquesInfo', priceSek: 349, image: '/merch/plaques.webp', cta: '/merch/plaques.webp', sizes: one },
  { id: 'tumblers', kind: 'accessories', nameKey: 'site.tumblers', infoKey: 'site.tumblersInfo', detailKey: 'site.tumblersInfo', priceSek: 349, image: '/merch/tumblers.webp', cta: '/merch/tumblers.webp', sizes: one },
  { id: 'model', kind: 'accessories', nameKey: 'site.model', infoKey: 'site.modelInfo', detailKey: 'site.modelInfo', priceSek: 699, image: '/merch/model.webp', cta: '/merch/model.webp', sizes: one },
  { id: 'giftbox', kind: 'accessories', nameKey: 'site.giftbox', infoKey: 'site.giftboxInfo', detailKey: 'site.giftboxInfo', priceSek: 699, image: '/merch/giftbox.webp', cta: '/merch/giftbox.webp', sizes: one },
  { id: 'rule', kind: 'accessories', nameKey: 'site.rule', infoKey: 'site.ruleInfo', detailKey: 'site.ruleInfo', priceSek: 149, image: '/merch/rule.webp', cta: '/merch/rule.webp', sizes: one },
  { id: 'doormat', kind: 'accessories', nameKey: 'site.doormat', infoKey: 'site.doormatInfo', detailKey: 'site.doormatInfo', priceSek: 349, image: '/merch/doormat.webp', cta: '/merch/doormat.webp', sizes: one },
  { id: 'throw', kind: 'accessories', nameKey: 'site.throw', infoKey: 'site.throwInfo', detailKey: 'site.throwInfo', priceSek: 699, image: '/merch/throw.webp', cta: '/merch/throw.webp', sizes: one },
  { id: 'drawings', kind: 'prints', nameKey: 'site.drawings', infoKey: 'site.drawingsInfo', detailKey: 'site.drawingsInfo', priceSek: 599, image: '/merch/drawings.webp', cta: '/merch/drawings.webp', sizes: one },
  { id: 'cards', kind: 'prints', nameKey: 'site.cards', infoKey: 'site.cardsInfo', detailKey: 'site.cardsInfo', priceSek: 299, image: '/merch/cards.webp', cta: '/merch/cards.webp', sizes: one },
  { id: 'pop', kind: 'prints', nameKey: 'site.pop', infoKey: 'site.popInfo', detailKey: 'site.popInfo', priceSek: 349, image: '/merch/pop.webp', cta: '/merch/pop.webp', sizes: one },
  { id: 'silk', kind: 'prints', nameKey: 'site.silk', infoKey: 'site.silkInfo', detailKey: 'site.silkInfo', priceSek: 349, image: '/merch/silk.webp', cta: '/merch/silk.webp', sizes: one }
];
