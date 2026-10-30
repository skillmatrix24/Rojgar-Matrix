
"use client"

import { IndianRupee } from "lucide-react";

interface TemplateProps {
  profile: any;
}

export function MinimalistTemplate({ profile }: TemplateProps) {
  return (
    <div className="resume-container min-h-[297mm] w-[210mm] bg-white text-slate-900 font-body flex flex-col p-10 relative overflow-visible">
      <div className="flex-1 overflow-visible flex flex-col">
        <header className="text-center space-y-3 pb-6 border-b">
          <h1 className="text-4xl font-light tracking-[0.2em] uppercase text-slate-800 leading-tight">{profile?.firstName} {profile?.lastName}</h1>
          <p className="text-sm text-slate-400 uppercase tracking-[0.3em] font-medium leading-tight">{profile?.preferredJobTitle || "Professional"}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
            <span>{profile?.email}</span>
            <span className="text-slate-200">|</span>
            <span>{profile?.phoneNumber}</span>
            <span className="text-slate-200">|</span>
            <span>{profile?.city}</span>
            {profile?.expectedSalary && (
              <>
                <span className="text-slate-200">|</span>
                <span className="text-primary font-black">Exp. Salary: ₹{profile.expectedSalary}</span>
              </>
            )}
          </div>
          {profile?.fullAddress && (
            <p className="text-[9px] text-slate-300 uppercase tracking-tighter mt-1 italic leading-tight">{profile.fullAddress}</p>
          )}
        </header>

        <div className="grid grid-cols-12 gap-8 mt-8 flex-1 overflow-visible">
          <div className="col-span-8 space-y-8 overflow-visible">
            <section className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Profile</h3>
              <p className="text-[11px] leading-relaxed text-slate-600 font-light">{profile?.resumeSummary}</p>
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Experience</h3>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center h-[24px]">
                    <h4 className="text-sm font-bold tracking-tight leading-[24px]">{profile?.currentDesignation}</h4>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-[24px]">Present</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-none">{profile?.currentCompany}</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-light whitespace-pre-wrap">{profile?.experience}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-4 space-y-8 border-l border-slate-100 pl-6">
            {profile?.fatherSpouseName && (
              <section className="space-y-1.5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Personal Info</h3>
                <p className="text-[9px] text-slate-600 font-medium leading-none mb-1">Father/H: {profile.fatherSpouseName}</p>
                {profile?.dob && <p className="text-[9px] text-slate-600 font-medium leading-none">DOB/Age: {profile.dob}</p>}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Expertise</h3>
              <div className="space-y-2">
                {profile?.skills?.map((s: string, i: number) => (
                  <div key={i} className="text-[10px] text-slate-700 font-medium tracking-wide flex items-center gap-2 h-[18px] leading-[18px]">
                    <div className="h-1 w-1 bg-slate-200 rounded-full shrink-0"></div>
                    {s}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Education</h3>
              <p className="text-[10px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{profile?.education}</p>
            </section>

            {profile?.languages && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 leading-none">Languages</h3>
                <p className="text-[10px] text-slate-600 font-medium leading-tight">{profile?.languages.join(', ')}</p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Branding Footer */}
      <footer className="mt-auto pt-4 text-center border-t border-slate-50 shrink-0 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-200 leading-tight">
          Generated by RozgarMatrix | Modern Job Marketplace
        </p>
      </footer>
    </div>
  );
}
