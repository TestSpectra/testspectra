import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'bg-slate-900 border-slate-800 text-slate-100',
          title: 'text-slate-100',
          description: 'text-slate-400',
          actionButton: 'bg-blue-600 text-white hover:bg-blue-700',
          cancelButton: 'bg-slate-800 text-slate-300 hover:bg-slate-700',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
