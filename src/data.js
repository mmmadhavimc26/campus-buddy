// Redrawn from Ankitdaf's 2012 VJTI signboard photograph (CC BY-SA 3.0).
// Geometry is schematic; connections are inferred, not a pedestrian survey.
export const layoutVersion='vjti-signboard-2012-v1';
export const project=([x,y])=>[Math.round(50+(x-700)*.36),Math.round(100+(y-550)*1.05)];
function place(id,name,category,point,reference_no,floor,aliases=[],facilities=[]){
  const [x,y]=project(point);
  return {id,name,category,x,y,width:36,height:28,reference_no:String(reference_no),building_id:String(reference_no),floor,kind:'location',layout_version:layoutVersion,description:`Shown at marker ${reference_no} on the 2012 campus signboard${floor?` (${floor})`:''}. Current use and access need confirmation.`,aliases,facilities};
}
export const places=[
  place('gate','Main Gate (North)','Entrance',[1715,995],'GN','Ground level',['entry','entrance','north gate']),
  place('main','Security Office','Offices',[1808,900],11,'Ground floor',['security','main building']),
  place('library','Library','Library',[1930,755],12,'First floor',['books','reading room']),
  place('admin','Administration & Accounts','Offices',[1808,900],11,'First floor',['admin','accounts','dean']),
  place('auditorium','Savitribai Phule Auditorium','Recreation',[1808,900],11,'Ground floor',['hall','events','auditorium']),
  place('computer','Computer Technology & MCA','Departments',[2030,862],14,'First / second floor',['cs','cse','it','computer','mca']),
  place('electrical','Electrical Engineering','Departments',[2030,716],13,'First floor',['ee','electrical']),
  place('mechanical','Mechanical Engineering & Workshop','Departments',[1157,680],3,'Ground / first floor',['mech','mechanical','workshop']),
  place('labs','Central Computing Facility','Labs',[1930,755],12,'Ground floor',['ccf','computing','computer lab']),
  place('canteen','Canteen','Food & facilities',[1635,750],9,'Ground floor',['food','cafe','cafeteria']),
  place('firstyear','First Year Classroom Complex','Departments',[845,696],1,'Ground floor',['fy','first year','classrooms','placement'],['Training & Placement (first floor)','Humanities & Management (second floor)']),
  place('production','Production Engineering','Departments',[982,683],2,'Second floor',['production']),
  place('chemistry','Applied Chemistry','Departments',[940,837],4,'',['chemistry','chem']),
  place('textile','Textile Manufacturers’ Department','Departments',[1425,752],6,'',['textile']),
  place('gymkhana','Gymkhana','Recreation',[1354,603],'6A','',['gymkhana']),
  place('maintenance','Maintenance & Structural Engineering','Offices',[1568,817],7,'Ground / first floor',['maintenance','structural','examination']),
  place('civil','Civil & Environmental Engineering','Departments',[1760,638],8,'First floor',['civil','environmental']),
  place('director','Director’s Office','Offices',[1630,870],10,'First floor',['director']),
  place('bungalow','Director’s Bungalow','Offices',[1220,900],5,'',['bungalow']),
  place('hostel-a','A Block Hostel','Hostels',[2202,730],16,'',['hostel a','a block']),
  place('hostel-b','B Block Hostel','Hostels',[2443,735],18,'',['hostel b','b block']),
  place('hostel-d','D Block Hostel','Hostels',[2920,672],21,'',['hostel d','d block']),
  place('hostel-c','C Block Hostel','Hostels',[3070,895],24,'',['hostel c','c block']),
  place('hostel-nri','NRI Hostel','Hostels',[3110,735],23,'',['nri','hostel']),
  place('gym','Gymnasium','Recreation',[2318,660],17,'',['gym','gymnasium']),
  place('mess','Boys’ Mess','Food & facilities',[2494,660],19,'',['mess','food']),
  place('ground','Football Ground','Recreation',[2235,871],'F','',['football','sports','ground']),
  place('cricket','Cricket Ground','Recreation',[2875,854],'C','',['cricket','sports']),
  place('basketball','Basketball Court','Recreation',[2595,849],'B','',['basketball','court']),
  place('tennis','Tennis Court','Recreation',[2460,964],'T','',['tennis','court']),
  place('gate-south','Main Gate (South)','Entrance',[1965,995],'GS','Ground level',['south gate'])
];
const junctionPoints={westSouth:[1280,955],westNorth:[1305,620],textileSouth:[1515,955],entry:[1730,955],eastEntry:[1965,955],westCourt:[1725,830],northCourt:[1800,680],eastCourt:[1875,830],eastNorth:[2085,610],eastSpine:[2085,955],hostelWalk:[2350,780],sportsWalk:[2520,955],farEast:[2980,985],eastHostels:[3030,780]};
export const junctions=Object.entries(junctionPoints).map(([name,point])=>{const [x,y]=project(point);return {id:`j-${name}`,name:'Path junction',category:'Junction',kind:'junction',layout_version:layoutVersion,x,y,width:1,height:1,description:'Inferred walkway junction.',aliases:[],facilities:[]};});
export const locations=[...places,...junctions];
const connections=[
  ['gate','j-entry'],['gate-south','j-eastEntry'],['j-entry','j-eastEntry'],['j-westSouth','j-textileSouth'],['j-textileSouth','j-entry'],['j-eastEntry','j-eastSpine'],['j-eastSpine','j-sportsWalk'],['j-sportsWalk','j-farEast'],
  ['j-westSouth','j-westNorth'],['j-westNorth','firstyear'],['j-westNorth','production'],['j-westNorth','mechanical'],['j-westSouth','chemistry'],['j-westSouth','bungalow'],['j-westNorth','gymkhana'],['j-textileSouth','textile'],['j-textileSouth','maintenance'],
  ['j-entry','main'],['main','admin'],['main','auditorium'],['main','j-westCourt'],['j-westCourt','director'],['j-westCourt','canteen'],['j-westCourt','j-northCourt'],['j-northCourt','civil'],['j-northCourt','j-eastCourt'],['j-eastCourt','library'],['library','labs'],['j-eastCourt','j-eastEntry'],
  ['j-eastEntry','computer'],['j-eastCourt','electrical'],['electrical','j-eastNorth'],['j-eastNorth','j-hostelWalk'],['j-eastSpine','j-hostelWalk'],['j-hostelWalk','hostel-a'],['j-hostelWalk','hostel-b'],['j-hostelWalk','gym'],['j-hostelWalk','mess'],['j-eastSpine','ground'],['j-sportsWalk','basketball'],['j-sportsWalk','tennis'],['j-farEast','cricket'],['j-farEast','hostel-c'],['j-farEast','j-eastHostels'],['j-eastHostels','hostel-nri'],['j-eastHostels','hostel-d'],['j-hostelWalk','j-eastHostels']
];
const bends={
  'j-westNorth:firstyear':[[1305,575],[830,575],[830,668]],
  'j-westNorth:production':[[982,620]],
  'j-westNorth:mechanical':[[1288,680]],
  'j-westSouth:chemistry':[[1020,955]],
  'j-westCourt:director':[[1725,935],[1630,935]],
  'j-eastCourt:j-eastEntry':[[1875,805],[1975,805],[1975,955]],
  'j-eastCourt:electrical':[[1875,680],[1975,680]],
  'j-eastNorth:j-hostelWalk':[[2085,780]],
  'j-eastSpine:j-hostelWalk':[[2085,780]],
  'j-hostelWalk:mess':[[2570,780],[2570,620],[2494,620]],
  'j-hostelWalk:j-eastHostels':[[2570,780],[2570,690],[3030,690]]
};
export const paths=connections.map(([from,to])=>{
  const a=locations.find(n=>n.id===from),b=locations.find(n=>n.id===to);
  const points=[[a.x,a.y],...(bends[`${from}:${to}`]??[]).map(project),[b.x,b.y]];
  const distance=Math.max(1,Math.round(points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0)));
  return {from,to,distance,distance_verified:false,points};
});
