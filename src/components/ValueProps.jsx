import React from "react";
import { Globe, Award, Leaf, Compass } from "lucide-react";

const props = [
    {
        icon: Compass,
        title: "Deep Experience",
        desc: "Decades of navigating complex international markets with ease.",
    },
    {
        icon: Award,
        title: "Premium Quality",
        desc: "Rigorous quality control at every stage of production and delivery.",
    },
    {
        icon: Leaf,
        title: "Sustainability",
        desc: "Committed to ethical sourcing and low environmental footprint.",
    },
    {
        icon: Globe,
        title: "Global Reach",
        desc: "Seamless logistics network connecting Ceylon to the world.",
    },
];

export default function ValueProps() {
    return (
        <section id="value-props" className="border-t border-gray-100 py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {props.map(({ icon: Icon, title, desc }) => (
                    <div key={title}>
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-teal-700" />
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
