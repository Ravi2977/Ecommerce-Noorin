

"use client";



import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import Link from "next/link";

import {

   ArrowLeft,

   ArrowRight,

   Check,

   CheckCircle2,

 
   CreditCard,

   Loader2,

   LockKeyhole,

   MapPin,

   PackageCheck,

   Plus,

   ShieldCheck,

   Truck,

   UserRound,

} from "lucide-react";

import { toast } from "sonner";



import useAuthStore from "@/store/auth.store";

import useCartStore from "@/store/cart.store";



import customerService from "@/service/modules/customer.service";

import addressService from "@/service/modules/address.service";

import storeService from "@/service/modules/store.service";

import deliveryService from "@/service/modules/delivery.service";

import checkoutService from "@/service/modules/checkout.service";



type Customer = {

   id?: number;

   name?: string;

   email?: string;

   phone?: string;

   emailVerified?: boolean;

   addresses?: Address[];

};



type Address = {

   id?: string;

   label?: string;

   recipientName?: string;

   phone?: string;

   addressLine1?: string;

   addressLine2?: string;

   city?: string;

   state?: string;

   postalCode?: string;

   country?: string;

   isDefault?: boolean;

};



type AddressForm = {

   recipientName: string;

   phone: string;

   addressLine1: string;

   addressLine2: string;

   city: string;

   state: string;

   postalCode: string;

   country: string;

};



type DeliveryResult = {

   pincode?: string;

   serviceable?: boolean | null;

   codAvailable?: boolean;

   estimatedDays?: number | null;

   message?: string;

};



const EMPTY_ADDRESS: AddressForm = {

   recipientName: "",

   phone: "",

   addressLine1: "",

   addressLine2: "",

   city: "",

   state: "",

   postalCode: "",

   country: "India",

};



const inputClass =

   "w-full rounded-none border border-[#ded6ca] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#aaa197] focus:border-[#8C6D1F] focus:ring-1 focus:ring-[#8C6D1F]/20";



const labelClass =

   "mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#625b52]";



const formatPrice = (value?: number | string | null) =>

   new Intl.NumberFormat("en-IN", {

     style: "currency",

     currency: "INR",

     maximumFractionDigits: 2,

   }).format(Number(value || 0));



const unwrap = (value: any) => value?.data ?? value;



function findRazorpayGatewayId(value: any): number | null {

   if (!value || typeof value !== "object") return null;



   if (

     !Array.isArray(value) &&

     String(value.provider || "").toUpperCase() === "RAZORPAY" &&

     value.id !== undefined &&

     value.id !== null

   ) {

     const id = Number(value.id);

     return Number.isFinite(id) ? id : null;

   }



   const values = Array.isArray(value) ? value : Object.values(value);



   for (const item of values) {

     const result = findRazorpayGatewayId(item);

     if (result !== null) return result;

   }



   return null;

}



export default function CheckoutPage() {

   const {

     isAuthenticated,

     customer: authCustomer,

     initializeAuth,

   } = useAuthStore();



   const {

     cart,

     cartToken,

     isLoading: cartLoading,

     initializeCart,

   } = useCartStore();




   const [addresses, setAddresses] = useState<Address[]>([]);

   const [selectedAddressId, setSelectedAddressId] = useState<string | null>(

     null

   );



   const [showNewAddress, setShowNewAddress] = useState(false);

   const [addressForm, setAddressForm] =

     useState<AddressForm>(EMPTY_ADDRESS);



   const [customerForm, setCustomerForm] = useState({

     name: "",

     email: "",

     phone: "",

     company: "",

   });



   const [notes, setNotes] = useState("");

   const [config, setConfig] = useState<any>(null);

   const [gatewayId, setGatewayId] = useState<number | null>(null);



   const [delivery, setDelivery] = useState<DeliveryResult | null>(null);

   const [checkingDelivery, setCheckingDelivery] = useState(false);

   const [savingAddress, setSavingAddress] = useState(false);

   const [placingOrder, setPlacingOrder] = useState(false);



   const [pageLoading, setPageLoading] = useState(true);

   const [profileLoading, setProfileLoading] = useState(false);

   const [pageError, setPageError] = useState("");



   const items = cart?.items || [];



   const subtotal = Number(cart?.subtotal || 0);

   const discount = Number(cart?.discount || 0);

   const shippingAmount = Number(cart?.shipping?.amount || 0);

   const taxAmount = Number(cart?.tax?.amount ?? cart?.taxAmount ?? 0);

   const total = Number(cart?.total || 0);



   const shippingThreshold = Number(

     cart?.freeShippingThreshold ??

       config?.shipping?.freeShippingThreshold ??

       999

   );



   const remainingForFreeShipping = Math.max(

     0,

     shippingThreshold - subtotal

   );



   const selectedAddress = useMemo(

     () =>

       addresses.find(

         (address) => String(address.id) === String(selectedAddressId)

       ) || null,

     [addresses, selectedAddressId]

   );


   // Guests always use the address form; signed-in users can use a saved or new address.
   const isUsingNewAddress =
     !isAuthenticated || showNewAddress || addresses.length === 0 || !selectedAddress;



   const loadInitialData = useCallback(async () => {

     setPageLoading(true);

     setPageError("");



     try {

       initializeAuth();



       const configResponse = await storeService.getConfig();

       const configData = unwrap(configResponse);



       setConfig(configData);



       const razorpayId = findRazorpayGatewayId(configData);

       setGatewayId(razorpayId);



       await initializeCart();

     } catch (error: any) {

       setPageError(

         error?.message || "Unable to load checkout information."

       );

     } finally {

       setPageLoading(false);

     }

   }, [initializeAuth, initializeCart]);



   useEffect(() => {

     loadInitialData();

   }, [loadInitialData]);



   useEffect(() => {

     if (!isAuthenticated) {
       setAddresses([]);
       setSelectedAddressId(null);
       setShowNewAddress(true);
       setDelivery(null);
       return;
     }



     let active = true;



     const loadCustomer = async () => {

       setProfileLoading(true);



       try {

         const [profileResponse, addressResponse] = await Promise.all([

           customerService.getProfile(),

           addressService.getAll(),

         ]);



         if (!active) return;



         const profile = unwrap(profileResponse) as Customer;

         const addressData = unwrap(addressResponse);



         const savedAddresses: Address[] = Array.isArray(addressData)

           ? addressData

           : addressData?.content || addressData?.addresses || [];




         setAddresses(savedAddresses);



         setCustomerForm({

           name: profile?.name || authCustomer?.name || "",

           email: profile?.email || authCustomer?.email || "",

           phone: profile?.phone || authCustomer?.phone || "",

           company: "",

         });



         const defaultAddress =

           savedAddresses.find((address) => address.isDefault) ||

           savedAddresses[0];



         if (defaultAddress?.id) {
           setSelectedAddressId(String(defaultAddress.id));
           setShowNewAddress(false);
         } else {
           setSelectedAddressId(null);
           setShowNewAddress(true);
         }

       } catch (error: any) {

         if (!active) return;

         toast.error(

           error?.message || "Unable to load your saved addresses."

         );

       } finally {

         if (active) setProfileLoading(false);

       }

     };



     loadCustomer();



     return () => {

       active = false;

     };

   }, [isAuthenticated, authCustomer]);



   const updateAddressField = (

     field: keyof AddressForm,

     value: string

   ) => {

     setAddressForm((previous) => ({
       ...previous,
       [field]: value,
     }));
     if (field === "postalCode") setDelivery(null);

   };



   const updateCustomerField = (

     field: keyof typeof customerForm,

     value: string

   ) => {

     setCustomerForm((previous) => ({

       ...previous,

       [field]: value,

     }));

   };



   const checkDelivery = async () => {
     const pincode = String(
       isUsingNewAddress ? addressForm.postalCode : selectedAddress?.postalCode || ""
     ).trim();

     if (!/^\d{6}$/.test(pincode)) {
       toast.error("Please enter a valid 6-digit pincode.");
       return;
     }

     setCheckingDelivery(true);
     setDelivery(null);

     try {
       const response = await deliveryService.check(pincode, false);
       const result = unwrap(response) as DeliveryResult;

       if (!result || typeof result !== "object") {
         throw new Error("Invalid delivery verification response.");
       }

       const normalizedResult: DeliveryResult = {
         ...result,
         pincode: String(result.pincode ?? pincode).trim(),
       };
       setDelivery(normalizedResult);

       if (normalizedResult.serviceable === false) {
         toast.error(
           normalizedResult.message || "Delivery is not available at this pincode."
         );
       } else {
         toast.success(
           normalizedResult.message || "Delivery information received."
         );
       }
     } catch (error: any) {
       setDelivery(null);
       toast.error(
         error?.response?.data?.message ||
           error?.message ||
           "Unable to verify delivery for this pincode."
       );
     } finally {
       setCheckingDelivery(false);
     }
   };


   const saveNewAddress = async () => {

     if (!isAuthenticated) return;



     const requiredFields = [

       addressForm.recipientName,

       addressForm.phone,

       addressForm.addressLine1,

       addressForm.city,

       addressForm.state,

       addressForm.postalCode,

       addressForm.country,

     ];



     if (requiredFields.some((field) => !field.trim())) {

       toast.error("Please fill in all required address fields.");

       return;

     }



     if (!/^\d{6}$/.test(addressForm.postalCode)) {

       toast.error("Please enter a valid 6-digit pincode.");

       return;

     }



     setSavingAddress(true);



     try {

       const response = await addressService.create({

         ...addressForm,

         label: "Home",

         isDefault: addresses.length === 0,

       });



       const savedAddress = unwrap(response);



       if (savedAddress?.id) {

         setAddresses((previous) => [...previous, savedAddress]);

         setSelectedAddressId(String(savedAddress.id));

         setShowNewAddress(false);

         setDelivery(null);

         setAddressForm(EMPTY_ADDRESS);

         toast.success("Address saved successfully.");

       } else {

         toast.error("Address saved, but the response did not contain an ID.");

       }

     } catch (error: any) {

       toast.error(error?.message || "Unable to save address.");

     } finally {

       setSavingAddress(false);

     }

   };



   const validateCheckout = () => {
     const storedCartToken =
       typeof window !== "undefined" ? localStorage.getItem("cartToken") : null;

     if (!cartToken && !storedCartToken) {
       toast.error("Your cart session is missing. Please refresh your cart.");
       return false;
     }

     if (!items.length) {
       toast.error("Your cart is empty.");
       return false;
     }

     if (!customerForm.name.trim()) {
       toast.error("Please enter your name.");
       return false;
     }

     if (!customerForm.email.trim()) {
       toast.error("Please enter your email.");
       return false;
     }

     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email.trim())) {
       toast.error("Please enter a valid email address.");
       return false;
     }

     if (!customerForm.phone.trim()) {
       toast.error("Please enter your phone number.");
       return false;
     }

     if (!gatewayId) {
       toast.error("Razorpay payment gateway is not configured. Please contact support.");
       return false;
     }

     const address = isUsingNewAddress ? addressForm : selectedAddress;

     if (!address) {
       toast.error("Please provide a delivery address.");
       return false;
     }

     const requiredAddressFields = [
       address.recipientName,
       address.phone,
       address.addressLine1,
       address.city,
       address.state,
       address.postalCode,
       address.country,
     ];

     if (requiredAddressFields.some((field) => !String(field || "").trim())) {
       toast.error("Please complete all required delivery address fields.");
       return false;
     }

     const addressPincode = String(address.postalCode || "").trim();
     if (!/^\d{6}$/.test(addressPincode)) {
       toast.error("Please enter a valid 6-digit delivery pincode.");
       return false;
     }

     if (delivery?.serviceable === false) {
       toast.error("Delivery is not available at this pincode.");
       return false;
     }

     if (
       !delivery ||
       String(delivery.pincode || "").trim() !== addressPincode
     ) {
       toast.error("Please check delivery availability for your current pincode before placing your order.");
       return false;
     }

     return true;
   };


   const placeOrder = async (event: FormEvent<HTMLFormElement>) => {

     event.preventDefault();



     if (placingOrder || !validateCheckout()) return;



     const address = isUsingNewAddress

       ? addressForm

       : selectedAddress;



     if (!address) return;



     const token =

       cartToken ||

       (typeof window !== "undefined"

         ? localStorage.getItem("cartToken")

         : null);



     if (!token) return;



     setPlacingOrder(true);



     try {

       const payload = {

         customer: {

           name: customerForm.name.trim(),

           email: customerForm.email.trim(),

           phone: customerForm.phone.trim(),

           company: customerForm.company.trim(),

         },

         shippingAddress: {

           addressLine1: address.addressLine1,

           addressLine2: address.addressLine2 || "",

           city: address.city,

           state: address.state,

           postalCode: address.postalCode,

           country: address.country,

           recipientName: address.recipientName || "",

           phone: address.phone || "",

         },

         paymentGatewayId: gatewayId,

         notes: notes.trim(),

       };



       const response = await checkoutService.create(token, payload);

       const result = unwrap(response);



       if (!result?.paymentUrl) {

         throw new Error(

           result?.message || "Checkout response did not contain a payment URL."

         );

       }



       if (result.paymentStatus === "PAID") {

         toast.success("Payment already completed.");

         window.location.href = "/account/orders";

         return;

       }



       window.location.assign(result.paymentUrl);

     } catch (error: any) {

       toast.error(

         error?.message || "Unable to create checkout. Please try again."

       );

       setPlacingOrder(false);

     }

   };



   if (pageLoading || cartLoading) {

     return (

       <main className="flex min-h-[70vh] items-center justify-center bg-[#FAF6EF]">

         <div className="text-center">

           <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#8C6D1F]" />

           <p className="font-serif text-xl text-[#2B2B2B]">

             Preparing your checkout

           </p>

           <p className="mt-2 text-xs tracking-wider text-[#81786d]">

             PLEASE WAIT...

           </p>

         </div>

       </main>

     );

   }



   if (pageError) {

     return (

       <main className="flex min-h-[65vh] items-center justify-center bg-[#FAF6EF] px-5">

         <div className="max-w-md text-center">

           <PackageCheck className="mx-auto mb-4 h-10 w-10 text-[#8C6D1F]" />

           <h1 className="font-serif text-3xl text-[#2B2B2B]">

             Checkout unavailable

           </h1>

           <p className="mt-3 text-sm text-[#756d63]">{pageError}</p>

           <button

             onClick={loadInitialData}

             className="mt-6 bg-[#2B2B2B] px-7 py-3 text-xs uppercase tracking-widest text-white"

           >

             Try again

           </button>

         </div>

       </main>

     );

   }



   if (!items.length) {

     return (

       <main className="flex min-h-[65vh] items-center justify-center bg-[#FAF6EF] px-5">

         <div className="text-center">

           <PackageCheck className="mx-auto mb-5 h-12 w-12 text-[#8C6D1F]" />

           <h1 className="font-serif text-4xl text-[#2B2B2B]">

             Your cart is empty

           </h1>

           <p className="mt-3 text-sm text-[#756d63]">

             Add something beautiful to your bag before checking out.

           </p>

           <Link

             href="/products"

             className="mt-7 inline-flex items-center gap-3 bg-[#2B2B2B] px-7 py-4 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-[#8C6D1F]"

           >

             Explore collection <ArrowRight size={15} />

           </Link>

         </div>

       </main>

     );

   }



   return (

     <main className="min-h-screen bg-[#FAF6EF] pb-20">

       {/* Page heading */}

       <section className="border-b border-[#e9e1d5] px-5 py-10 md:px-10 md:py-14">

         <div className="mx-auto max-w-7xl">

           <Link

             href="/cart"

             className="mb-7 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#766d62] transition hover:text-[#8C6D1F]"

           >

             <ArrowLeft size={14} /> Back to bag

           </Link>



           <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

             <div>

               <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#8C6D1F]">

                 NOORINE · EVERYDAY SHINE

               </p>

               <h1 className="font-serif text-4xl text-[#2B2B2B] md:text-6xl">

                 Checkout

               </h1>

               <p className="mt-3 text-sm text-[#756d63]">

                 Almost yours. Complete your details to place your order.

               </p>

             </div>



             <div className="flex items-center gap-2 text-xs text-[#756d63]">

               <LockKeyhole size={15} className="text-[#8C6D1F]" />

               Secure checkout

             </div>

           </div>

         </div>

       </section>



       <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-10 md:px-10 lg:grid-cols-[1fr_390px] lg:gap-14">

         {/* Checkout form */}

         <form onSubmit={placeOrder} className="space-y-10">

           {/* Customer information */}

           <section>

             <div className="mb-6 flex items-center gap-3">

               <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9dfd0] text-[#8C6D1F]">

                 <UserRound size={17} />

               </div>

               <div>

                 <h2 className="font-serif text-2xl text-[#2B2B2B]">

                   Contact information

                 </h2>

                 <p className="mt-1 text-xs text-[#81786d]">

                   Where should we send your order updates?

                 </p>

               </div>

             </div>



             {isAuthenticated && (

               <div className="mb-5 flex items-center gap-2 border border-[#d9cbb5] bg-[#f3ede3] px-4 py-3 text-xs text-[#6c5a39]">

                 <CheckCircle2 size={16} />

                 You are checking out with your NOORINE account.

               </div>

             )}



             <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

               <div>

                 <label className={labelClass}>Full name *</label>

                 <input

                   className={inputClass}

                   placeholder="Enter your full name"

                   value={customerForm.name}

                   onChange={(e) =>

                     updateCustomerField("name", e.target.value)

                   }

                   required

                 />

               </div>



               <div>

                 <label className={labelClass}>Email address *</label>

                 <input

                   type="email"

                   className={inputClass}

                   placeholder="you@example.com"

                   value={customerForm.email}

                   onChange={(e) =>

                     updateCustomerField("email", e.target.value)

                   }

                   required

                 />

               </div>



               <div>

                 <label className={labelClass}>Phone number *</label>

                 <input

                   type="tel"

                   className={inputClass}

                   placeholder="+91 98765 43210"

                   value={customerForm.phone}

                   onChange={(e) =>

                     updateCustomerField("phone", e.target.value)

                   }

                   required

                 />

               </div>



               <div>

                 <label className={labelClass}>Company (optional)</label>

                 <input

                   className={inputClass}

                   placeholder="Company name"

                   value={customerForm.company}

                   onChange={(e) =>

                     updateCustomerField("company", e.target.value)

                   }

                 />

               </div>

             </div>

           </section>



           <div className="h-px bg-[#e5dccf]" />



           {/* Shipping address */}

           <section>

             <div className="mb-6 flex items-center gap-3">

               <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9dfd0] text-[#8C6D1F]">

                 <MapPin size={17} />

               </div>

               <div>

                 <h2 className="font-serif text-2xl text-[#2B2B2B]">

                   Delivery address

                 </h2>

                 <p className="mt-1 text-xs text-[#81786d]">

                   Where would you like your order delivered?

                 </p>

               </div>

             </div>



             {profileLoading ? (

               <div className="flex items-center gap-2 py-6 text-sm text-[#81786d]">

                 <Loader2 size={17} className="animate-spin" />

                 Loading your saved addresses...

               </div>

             ) : (

               <>

                 {isAuthenticated && addresses.length > 0 && (

                   <div className="mb-6 space-y-3">

                     {addresses.map((address) => {

                       const selected =

                         String(address.id) === String(selectedAddressId) &&

                         !showNewAddress;



                       return (

                         <button

                           key={address.id}

                           type="button"

                           onClick={() => {

                             setSelectedAddressId(String(address.id));

                             setShowNewAddress(false);

                             setDelivery(null);

                           }}

                           className={`w-full border p-4 text-left transition ${

                             selected

                               ? "border-[#8C6D1F] bg-[#f5efe4]"

                               : "border-[#e2d9cc] bg-white hover:border-[#b9a47d]"

                           }`}

                         >

                           <div className="flex items-start justify-between gap-4">

                             <div className="flex gap-3">

                               <div

                                 className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${

                                   selected

                                     ? "border-[#8C6D1F] bg-[#8C6D1F]"

                                     : "border-[#bcb2a4]"

                                 }`}

                               >

                                 {selected && (

                                   <Check size={10} className="text-white" />

                                 )}

                               </div>



                               <div>

                                 <div className="flex flex-wrap items-center gap-2">

                                   <span className="text-sm font-medium text-[#2B2B2B]">

                                     {address.label || "Address"}

                                   </span>

                                   {address.isDefault && (

                                     <span className="bg-[#e9dfd0] px-2 py-1 text-[9px] uppercase tracking-wider text-[#755a25]">

                                       Default

                                     </span>

                                   )}

                                 </div>



                                 <p className="mt-2 text-sm text-[#4f4941]">

                                   {address.recipientName}

                                 </p>

                                 <p className="mt-1 text-xs leading-6 text-[#81786d]">

                                   {address.addressLine1}

                                   {address.addressLine2

                                     ? `, ${address.addressLine2}`

                                     : ""}

                                   , {address.city}, {address.state} -{" "}

                                   {address.postalCode}, {address.country}

                                 </p>

                                 <p className="mt-1 text-xs text-[#81786d]">

                                   {address.phone}

                                 </p>

                               </div>

                             </div>



                             {selected && (

                               <CheckCircle2

                                 size={19}

                                 className="shrink-0 text-[#8C6D1F]"

                               />

                             )}

                           </div>

                         </button>

                       );

                     })}

                   </div>

                 )}



                 {isAuthenticated && (

                   <button

                     type="button"

                     onClick={() => {

                       setShowNewAddress(true);

                       setSelectedAddressId(null);



                       setAddressForm({

                         ...EMPTY_ADDRESS,

                         recipientName: customerForm.name,

                         phone: customerForm.phone,

                       });



                       setDelivery(null);

                     }}

                     className={`mb-5 flex w-full items-center justify-center gap-2 border border-dashed px-4 py-4 text-xs uppercase tracking-widest transition ${

                       showNewAddress

                         ? "border-[#8C6D1F] bg-[#f5efe4] text-[#8C6D1F]"

                         : "border-[#cfc4b4] text-[#625b52] hover:border-[#8C6D1F]"

                     }`}

                   >

                     <Plus size={16} /> Add a new address

                   </button>

                 )}



                 {(!isAuthenticated || showNewAddress || addresses.length === 0) && (

                   <div className="border border-[#e2d9cc] bg-white p-5 md:p-6">

                     <h3 className="mb-5 font-serif text-xl text-[#2B2B2B]">

                       {isAuthenticated

                         ? "New delivery address"

                         : "Your delivery details"}

                     </h3>



                     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                       <div>

                         <label className={labelClass}>

                           Recipient name *

                         </label>

                         <input

                           className={inputClass}

                           placeholder="Recipient name"

                           value={addressForm.recipientName}

                           onChange={(e) =>

                             updateAddressField(

                               "recipientName",

                               e.target.value

                             )

                           }

                           required

                         />

                       </div>



                       <div>

                         <label className={labelClass}>

                           Delivery phone *

                         </label>

                         <input

                           type="tel"

                           className={inputClass}

                           placeholder="+91 98765 43210"

                           value={addressForm.phone}

                           onChange={(e) =>

                             updateAddressField("phone", e.target.value)

                           }

                           required

                         />

                       </div>



                       <div className="sm:col-span-2">

                         <label className={labelClass}>

                           Address line 1 *

                         </label>

                         <input

                           className={inputClass}

                           placeholder="House number, building, street"

                           value={addressForm.addressLine1}

                           onChange={(e) =>

                             updateAddressField(

                               "addressLine1",

                               e.target.value

                             )

                           }

                           required

                         />

                       </div>



                       <div className="sm:col-span-2">

                         <label className={labelClass}>

                           Address line 2

                         </label>

                         <input

                           className={inputClass}

                           placeholder="Apartment, landmark (optional)"

                           value={addressForm.addressLine2}

                           onChange={(e) =>

                             updateAddressField(

                               "addressLine2",

                               e.target.value

                             )

                           }

                         />

                       </div>



                       <div>

                         <label className={labelClass}>City *</label>

                         <input

                           className={inputClass}

                           placeholder="City"

                           value={addressForm.city}

                           onChange={(e) =>

                             updateAddressField("city", e.target.value)

                           }

                           required

                         />

                       </div>



                       <div>

                         <label className={labelClass}>State *</label>

                         <input

                           className={inputClass}

                           placeholder="State"

                           value={addressForm.state}

                           onChange={(e) =>

                             updateAddressField("state", e.target.value)

                           }

                           required

                         />

                       </div>



                       <div>

                         <label className={labelClass}>Pincode *</label>

                         <input

                           inputMode="numeric"

                           maxLength={6}

                           className={inputClass}

                           placeholder="6-digit pincode"

                           value={addressForm.postalCode}

                           onChange={(e) => {

                             updateAddressField(

                               "postalCode",

                               e.target.value.replace(/\D/g, "").slice(0, 6)

                             );

                             setDelivery(null);

                           }}

                           required

                         />

                       </div>



                       <div>

                         <label className={labelClass}>Country *</label>

                         <input

                           className={inputClass}

                           value={addressForm.country}

                           onChange={(e) =>

                             updateAddressField("country", e.target.value)

                           }

                           required

                         />

                       </div>

                     </div>



                     {isAuthenticated && (

                       <button

                         type="button"

                         onClick={saveNewAddress}

                         disabled={savingAddress}

                         className="mt-5 inline-flex items-center gap-2 border border-[#8C6D1F] px-5 py-3 text-xs uppercase tracking-widest text-[#8C6D1F] transition hover:bg-[#8C6D1F] hover:text-white disabled:opacity-50"

                       >

                         {savingAddress ? (

                           <Loader2 size={15} className="animate-spin" />

                         ) : (

                           <Plus size={15} />

                         )}

                         Save address

                       </button>

                     )}

                   </div>

                 )}



                 {/* Delivery checker */}

                 <div className="mt-5 border border-[#e2d9cc] bg-white p-4">

                   <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                     <div>

                       <p className="text-sm font-medium text-[#2B2B2B]">

                         Check delivery availability

                       </p>

                       <p className="mt-1 text-xs text-[#81786d]">

                         Verify delivery service for your pincode.

                       </p>

                     </div>



                     <button

                       type="button"

                       onClick={checkDelivery}

                       disabled={checkingDelivery}

                       className="inline-flex items-center justify-center gap-2 bg-[#2B2B2B] px-5 py-3 text-[10px] uppercase tracking-widest text-white transition hover:bg-[#8C6D1F] disabled:opacity-50"

                     >

                       {checkingDelivery ? (

                         <Loader2 size={14} className="animate-spin" />

                       ) : (

                         <Truck size={14} />

                       )}

                       Check delivery

                     </button>

                   </div>



                   {delivery && (

                     <div className="mt-4 border-t border-[#eee7dc] pt-4">

                       <div className="flex items-start gap-2">

                         {delivery.serviceable === false ? (

                           <span className="mt-0.5 text-red-600">●</span>

                         ) : delivery.serviceable === true ? (

                           <CheckCircle2

                             size={16}

                             className="mt-0.5 text-green-700"

                           />

                         ) : (

                           <PackageCheck

                             size={16}

                             className="mt-0.5 text-[#8C6D1F]"

                           />

                         )}



                         <div>

                           <p className="text-xs font-medium text-[#2B2B2B]">

                             {delivery.message ||

                               "Delivery information received."}

                           </p>



                           {delivery.estimatedDays != null && (

                             <p className="mt-1 text-xs text-[#81786d]">

                               Estimated delivery: {delivery.estimatedDays}{" "}

                               days

                             </p>

                           )}



                           {delivery.codAvailable === false && (

                             <p className="mt-1 text-xs text-[#81786d]">

                               Cash on Delivery is not available.

                             </p>

                           )}

                         </div>

                       </div>

                     </div>

                   )}

                 </div>

               </>

             )}

           </section>



           <div className="h-px bg-[#e5dccf]" />



           {/* Notes */}

           <section>

             <h2 className="mb-4 font-serif text-2xl text-[#2B2B2B]">

               Order notes

             </h2>

             <label className={labelClass}>

               Special delivery instructions (optional)

             </label>

             <textarea

               rows={3}

               className={`${inputClass} resize-y`}

               placeholder="Leave at reception, call before delivery..."

               value={notes}

               onChange={(e) => setNotes(e.target.value)}

             />

           </section>



           {/* Payment */}

           <section className="border border-[#e2d9cc] bg-white p-5 md:p-6">

             <div className="flex items-start gap-4">

               <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f1e9dc] text-[#8C6D1F]">

                 <CreditCard size={20} />

               </div>



               <div className="flex-1">

                 <h2 className="font-serif text-2xl text-[#2B2B2B]">

                   Payment method

                 </h2>

                 <p className="mt-1 text-xs text-[#81786d]">

                   Secure online payment powered by Razorpay.

                 </p>



                 <div className="mt-5 flex items-center justify-between border border-[#d9cbb5] bg-[#f7f2e9] p-4">

                   <div className="flex items-center gap-3">

                     <div className="flex h-9 w-9 items-center justify-center bg-white text-[#8C6D1F]">

                       <CreditCard size={17} />

                     </div>

                     <div>

                       <p className="text-sm font-medium text-[#2B2B2B]">

                         Razorpay

                       </p>

                       <p className="mt-1 text-[10px] text-[#81786d]">

                         UPI · Cards · Net Banking · Wallets

                       </p>

                     </div>

                   </div>



                   <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#8C6D1F] bg-[#8C6D1F]">

                     <Check size={12} className="text-white" />

                   </span>

                 </div>



                 {!gatewayId && (

                   <p className="mt-3 text-xs text-red-600">

                     Razorpay gateway is not available in the store configuration.

                   </p>

                 )}

               </div>

             </div>

           </section>



           <button

             type="submit"

             disabled={placingOrder}

             className="flex w-full items-center justify-center gap-3 bg-[#2B2B2B] px-7 py-5 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50"

           >

             {placingOrder ? (

               <>

                 <Loader2 size={17} className="animate-spin" />

                 Creating checkout...

               </>

             ) : (

               <>

                 Continue to payment

                 <ArrowRight size={16} />

               </>

             )}

           </button>



           <p className="flex items-center justify-center gap-2 text-center text-[10px] tracking-wide text-[#81786d]">

             <ShieldCheck size={14} />

             Your payment details are securely processed by Razorpay.

           </p>

         </form>



         {/* Order summary */}

         <aside className="h-fit border border-[#e2d9cc] bg-white lg:sticky lg:top-8">

           <div className="border-b border-[#e9e1d5] px-6 py-5">

             <h2 className="font-serif text-2xl text-[#2B2B2B]">

               Order summary

             </h2>

             <p className="mt-1 text-xs text-[#81786d]">

               {cart?.itemCount ?? items.length} items in your bag

             </p>

           </div>



           <div className="max-h-[360px] space-y-5 overflow-y-auto px-6 py-6">

             {items.map((item: any, index: number) => {

               const image =

                 item.image ||

                 item.imageUrl ||

                 item.productImage ||

                 null;



               return (

                 <div

                   key={item.id || item.productId || index}

                   className="flex gap-4"

                 >

                   <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-[#f5f0e8]">

                     {image ? (

                       <img

                         src={image}

                         alt={item.name || "NOORINE product"}

                         className="h-full w-full object-cover"

                       />

                     ) : (

                       <div className="flex h-full items-center justify-center text-[9px] text-[#9a8d7b]">

                         NOORINE

                       </div>

                     )}

                     <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2B2B2B] text-[10px] text-white">

                       {item.quantity}

                     </span>

                   </div>



                   <div className="min-w-0 flex-1">

                     <p className="line-clamp-2 text-sm font-medium text-[#2B2B2B]">

                       {item.name || "Product"}

                     </p>

                     {item.variantName && (

                       <p className="mt-1 text-[10px] text-[#81786d]">

                         {item.variantName}

                       </p>

                     )}

                     <p className="mt-2 text-xs text-[#81786d]">

                       Qty: {item.quantity}

                     </p>

                   </div>



                   <p className="shrink-0 text-sm text-[#2B2B2B]">

                     {formatPrice(item.lineTotal)}

                   </p>

                 </div>

               );

             })}

           </div>



           {remainingForFreeShipping > 0 && (

             <div className="border-y border-[#e9e1d5] bg-[#faf7f1] px-6 py-4">

               <div className="flex items-center gap-2 text-[#8C6D1F]">

                 <Truck size={16} />

                 <p className="text-xs">

                   Add {formatPrice(remainingForFreeShipping)} more for free shipping.

                 </p>

               </div>

               <div className="mt-3 h-1.5 overflow-hidden bg-[#e6dfd3]">

                 <div

                   className="h-full bg-[#C9A24B] transition-all"

                   style={{

                     width: `${Math.min(

                       100,

                       (subtotal / Math.max(1, shippingThreshold)) * 100

                     )}%`,

                   }}

                 />

               </div>

             </div>

           )}



           <div className="space-y-4 px-6 py-6">

             <div className="flex justify-between text-xs text-[#756d63]">

               <span>Subtotal</span>

               <span>{formatPrice(subtotal)}</span>

             </div>



             {discount > 0 && (

               <div className="flex justify-between text-xs text-green-700">

                 <span>Discount</span>

                 <span>-{formatPrice(discount)}</span>

               </div>

             )}



             <div className="flex justify-between text-xs text-[#756d63]">

               <span>Shipping</span>

               <span>

                 {shippingAmount === 0

                   ? "FREE"

                   : formatPrice(shippingAmount)}

               </span>

             </div>



             <div className="flex justify-between text-xs text-[#756d63]">

               <span>{config?.tax?.label || "GST"}</span>

               <span>{formatPrice(taxAmount)}</span>

             </div>



             <div className="border-t border-[#e9e1d5] pt-5">

               <div className="flex items-center justify-between">

                 <span className="font-serif text-xl text-[#2B2B2B]">

                   Total

                 </span>

                 <span className="font-serif text-2xl text-[#2B2B2B]">

                   {formatPrice(total)}

                 </span>

               </div>

               <p className="mt-2 text-right text-[10px] text-[#81786d]">

                 Including applicable GST

               </p>

             </div>

           </div>



           <div className="border-t border-[#e9e1d5] bg-[#faf7f1] px-6 py-5">

             <div className="flex items-center gap-3">

               <ShieldCheck

                 size={19}

                 className="shrink-0 text-[#8C6D1F]"

               />

               <div>

                 <p className="text-xs font-medium text-[#2B2B2B]">

                   Safe & secure shopping

                 </p>

                 <p className="mt-1 text-[10px] text-[#81786d]">

                   Your information is protected.

                 </p>

               </div>

             </div>

           </div>

         </aside>

       </div>

     </main>

   );

}
