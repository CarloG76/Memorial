export const MEMORIAL_BACKGROUNDS = [
 {id:"montagna",label:"Montagna",image:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1800&q=85"},
 {id:"prato",label:"Prato",image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=85"},
 {id:"mare",label:"Mare",image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=85"},
 {id:"lago",label:"Lago",image:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1800&q=85"},
 {id:"bosco",label:"Bosco",image:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=1800&q=85"},
 {id:"collina",label:"Collina",image:"https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1800&q=85"},
 {id:"cielo",label:"Cielo",image:"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1800&q=85"}
] as const;
export type MemorialBackgroundPreset = typeof MEMORIAL_BACKGROUNDS[number]["id"];
export function memorialBackgroundUrl(preset:string):string {
 return MEMORIAL_BACKGROUNDS.find(item=>item.id===preset)?.image??MEMORIAL_BACKGROUNDS[0].image;
}
