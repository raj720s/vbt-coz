// "use client";

// import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
// import Button from "@/components/ui/button/Button";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { 
//   BoxIcon, 
//   GlobeIcon, 
//   PlusIcon, 
//   SettingsIcon,
//   ArrowRightIcon 
// } from "@/icons";

// interface MasterSection {
//   id: string;
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   path: string;
//   count: number;
//   color: string;
// }

// function PortCustomerMasterPage() {
//   const router = useRouter();
  
//   const masterSections: MasterSection[] = [
//     {
//       id: "pol-ports",
//       title: "POL Master",
//       description: "Manage Port of Loading ports for container shipments",
//       icon: <BoxIcon className="w-8 h-8" />,
//       path: "/port-customer-master/pol-ports",
//       count: 6,
//       color: "bg-blue-500"
//     },
//     {
//       id: "pod-ports",
//       title: "POD Master", 
//       description: "Manage Port of Discharge ports for container shipments",
//       icon: <GlobeIcon className="w-8 h-8" />,
//       path: "/port-customer-master/pod-ports",
//       count: 6,
//       color: "bg-green-500"
//     },
//     {
//       id: "customers",
//       title: "Customer Records",
//       description: "Manage customer information and contact details",
//       icon: <SettingsIcon className="w-8 h-8" />,
//       path: "/port-customer-master/customers",
//       count: 3,
//       color: "bg-purple-500"
//     }
//   ];

//   const handleSectionClick = (path: string) => {
//     router.push(path);
//   };

//   const handleQuickAdd = (sectionId: string) => {
//     const section = masterSections.find(s => s.id === sectionId);
//     if (section) {
//       router.push(`${section.path}?action=add`);
//     }
//   };

//   return (
//     <div className="p-0">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//           Master Data Management
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400 text-lg">
//           Centralized control for managing ports and customer data across the system
//         </p>
//       </div>

//       {/* Master Sections Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         {masterSections.map((section) => (
//           <div
//             key={section.id}
//             className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group"
//             onClick={() => handleSectionClick(section.path)}
//           >
//             <div className="p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div className={`p-3 rounded-lg ${section.color} text-white`}>
//                   {section.icon}
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-gray-900 dark:text-white">
//                     {section.count}
//                   </div>
//                   <div className="text-sm text-gray-500 dark:text-gray-400">
//                     Total Records
//                   </div>
//                 </div>
//               </div>
              
//               <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//                 {section.title}
//               </h3>
              
//               <p className="text-gray-600 dark:text-gray-400 mb-4">
//                 {section.description}
//               </p>
              
//               <div className="flex items-center justify-between">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => handleQuickAdd(section.id)}
//                   className="group-hover:bg-gray-50 dark:group-hover:bg-gray-800"
//                 >
//                   <PlusIcon className="w-4 h-4 mr-2" />
//                   Quick Add
//                 </Button>
                
//                 <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
//                   <span className="text-sm font-medium">Manage</span>
//                   <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//           Quick Actions
//         </h3>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Button
//             variant="outline"
//             onClick={() => router.push("/port-customer-master/pol-ports?action=add")}
//             className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
//           >
//             <PlusIcon className="w-5 h-5 text-blue-600" />
//             <span>Add POL Port</span>
//           </Button>
          
//           <Button
//             variant="outline"
//             onClick={() => router.push("/port-customer-master/pod-ports?action=add")}
//             className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
//           >
//             <PlusIcon className="w-5 h-5 text-green-600" />
//             <span>Add POD Port</span>
//           </Button>
          
//           <Button
//             variant="outline"
//             onClick={() => router.push("/port-customer-master/customers?action=add")}
//             className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
//           >
//             <PlusIcon className="w-5 h-5 text-purple-600" />
//             <span>Add Customer</span>
//           </Button>
//         </div>
//       </div>

//       {/* System Information */}
//       <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
//           System Overview
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//           <div>
//             <div className="font-medium text-gray-700 dark:text-gray-300">Total Records</div>
//             <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//               {masterSections.reduce((sum, section) => sum + section.count, 0)}
//             </div>
//           </div>
//           <div>
//             <div className="font-medium text-gray-700 dark:text-gray-300">Active Sections</div>
//             <div className="text-2xl font-bold text-green-600 dark:text-green-400">
//               {masterSections.length}
//             </div>
//           </div>
//           <div>
//             <div className="font-medium text-gray-700 dark:text-gray-300">Last Updated</div>
//             <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
//               Today
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default withSimplifiedRBAC(PortCustomerMasterPage, {
//   privilege: "VIEW_PORT_CUSTOMER_MASTER"
// }); 


import { redirect } from 'next/navigation'


function PortCustomerMasterPage() {
  redirect('/port-customer-master/pol-ports')
}

export default PortCustomerMasterPage;