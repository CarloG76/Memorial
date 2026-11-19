export function memorialPortraitSrc(value:string|null|undefined):string{
 if(!value)return "";
 if(value.startsWith("/storage/v1/object/public/memorial-portraits/")){
  const origin=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
  return origin+value;
 }
 return value;
}
