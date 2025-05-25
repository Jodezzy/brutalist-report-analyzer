"use client";

import type React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<div className={cn("relative bg-gray-800 rounded-xl shadow-xl border border-gray-700 max-w-md w-full mx-4", className)}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h3 className="text-lg font-semibold text-indigo-200">{title}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4">{children}</div>
			</div>
		</div>
	);
};

export default Modal;
