// A positive graph weight alone is not evidence of a measured walking distance.
export function distancePresentation(result) {
  return result.distanceVerified
    ? {value:String(result.distance),unit:'m',label:'Verified route distance',time:String(result.minutes),timeUnit:'min',timeLabel:'Estimated walk'}
    : {value:String(result.distance),unit:'units',label:'Unverified demo weight',time:'—',timeUnit:'',timeLabel:'Walking time unavailable'};
}
