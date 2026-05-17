import React from "react";
import { Sprout, HardHat, Factory, Laptop, Package } from "lucide-react";

const sectors = [
    {
        name: "Agriculture",
        icon: Sprout,
        image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
        span: "col-span-1",
    },
    {
        name: "Construction",
        icon: HardHat,
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
        span: "col-span-1",
    },
    {
        name: "Manufacturing",
        icon: Factory,
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
        span: "col-span-1",
    },
    {
        name: "Services",
        icon: Laptop,
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80",
        span: "col-span-1",
    },
];

export default function StrategicSectors() {
    return (
        <section id="sectors" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Our Verticals</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Strategic Sectors</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Agriculture - tall left */}
                <div className="row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer">
                    <img
                        src={sectors[0].image}
                        alt={sectors[0].name}
                        className="w-full h-full min-h-[280px] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                        <Sprout className="w-5 h-5" />
                        <span className="font-semibold">{sectors[0].name}</span>
                    </div>
                </div>

                {/* Construction - top right */}
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                    <img
                        src={sectors[1].image}
                        alt={sectors[1].name}
                        className="w-full h-full min-h-[135px] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                        <HardHat className="w-5 h-5" />
                        <span className="font-semibold">{sectors[1].name}</span>
                    </div>
                </div>

                {/* General Products card */}
                <div className="row-span-2 bg-slate-100 rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex gap-2 mb-4">
                        <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">General Products</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Curated selection of essential lifestyle and commercial goods.
                    </p>
                    <a href="#deals" className="text-teal-700 text-sm font-medium hover:underline">
                        &rarr;
                    </a>
                </div>

                {/* Manufacturing */}
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                    <img
                        src={sectors[2].image}
                        alt={sectors[2].name}
                        className="w-full h-full min-h-[135px] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                        <Factory className="w-5 h-5" />
                        <span className="font-semibold">{sectors[2].name}</span>
                    </div>
                </div>

                {/* Services */}
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                    <img
                        src={sectors[3].image}
                        alt={sectors[3].name}
                        className="w-full h-full min-h-[135px] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                        <Laptop className="w-5 h-5" />
                        <span className="font-semibold">{sectors[3].name}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
