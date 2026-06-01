import svgPaths from "./svg-uji3keybmd";
import imgEllipse8 from "figma:asset/b401350797b1f7b0887668ca993df3fac0733ef5.png";

function Bg() {
  return <div className="absolute contents left-0 top-0" data-name="BG" />;
}

function Battery() {
  return (
    <div className="absolute contents right-[14.67px] top-[17.33px]" data-name="Battery">
      <div className="absolute h-[11.333px] right-[17px] top-[17.33px] w-[22px]" data-name="Rectangle">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 12">
          <path d={svgPaths.p7e6b880} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, white)" />
        </svg>
      </div>
      <div className="absolute h-[4px] right-[14.67px] top-[21px] w-[1.328px]" data-name="Combined Shape">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 4">
          <path d={svgPaths.p32d253c0} fill="var(--fill-0, white)" id="Combined Shape" opacity="0.4" />
        </svg>
      </div>
      <div className="absolute h-[7.333px] right-[19px] top-[19.33px] w-[18px]" data-name="Rectangle">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 8">
          <path d={svgPaths.p3544af00} fill="var(--fill-0, white)" id="Rectangle" />
        </svg>
      </div>
    </div>
  );
}

function RightSide() {
  return (
    <div className="absolute contents right-[14.67px] top-[17.33px]" data-name="Right Side">
      <Battery />
      <div className="absolute h-[10.966px] right-[44.03px] top-[17.33px] w-[15.272px]" data-name="Wifi">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 11">
          <path d={svgPaths.p19201300} fill="var(--fill-0, white)" id="Wifi" />
        </svg>
      </div>
      <div className="absolute h-[10.667px] right-[64.33px] top-[17.67px] w-[17px]" data-name="Mobile Signal">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 11">
          <path d={svgPaths.p2abaf680} fill="var(--fill-0, white)" id="Mobile Signal" />
        </svg>
      </div>
    </div>
  );
}

function LeftSide() {
  return (
    <div className="absolute contents left-[33.45px] top-[17.17px]" data-name="Left Side">
      <div className="absolute h-[11.089px] left-[33.45px] top-[17.17px] w-[28.426px]" data-name="9:41">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 12">
          <g id="9:41">
            <path d={svgPaths.p1218b780} fill="var(--fill-0, white)" />
            <path d={svgPaths.p25dc35c0} fill="var(--fill-0, white)" />
            <path d={svgPaths.p38b62380} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3a930400} fill="var(--fill-0, white)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function IOsStatusBarBlack() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-0" data-name="iOS/Status Bar/Black">
      <Bg />
      <RightSide />
      <LeftSide />
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents left-[285px] top-[89px]">
      <div className="absolute left-[285px] size-[66px] top-[89px]">
        <img alt="" className="block max-w-none size-full" height="66" src={imgEllipse8} width="66" />
      </div>
    </div>
  );
}

function FilterList() {
  return (
    <div className="absolute left-[309px] size-[24px] top-[361px]" data-name="filter-list">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="filter-list">
          <path d={svgPaths.p57ef580} id="Icon" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Play() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="play">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="play">
          <path d={svgPaths.p5c0fe00} fill="var(--fill-0, black)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex items-center left-[254px] top-[471px]">
      <p className="font-['Montserrat_Alternates:Bold',sans-serif] leading-[1.08] not-italic relative shrink-0 text-[15px] text-black text-nowrap whitespace-pre">Почати</p>
      <Play />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents left-[242px] top-[456px]">
      <div className="absolute bg-[#f5f2b8] h-[55px] left-[242px] rounded-[27.5px] top-[456px] w-[106px]" />
      <Frame />
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute left-[21px] size-[47px] top-[464px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47 47">
        <g id="Group 29">
          <circle cx="23.5" cy="23.5" fill="var(--fill-0, #F5F2B8)" id="Ellipse 14" r="23.5" />
          <circle cx="24" cy="24" fill="var(--fill-0, #262135)" id="Ellipse 15" r="6" />
        </g>
      </svg>
    </div>
  );
}

function WeekBase() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[35px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">Mon</p>
    </div>
  );
}

function WeekBase1() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[81.89px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">tue</p>
    </div>
  );
}

function WeekBase2() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[128.78px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">wed</p>
    </div>
  );
}

function WeekBase3() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[175.66px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">thu</p>
    </div>
  );
}

function WeekBase4() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[222.55px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Semi_Bold',sans-serif] font-semibold grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">fri</p>
    </div>
  );
}

function WeekBase5() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[269.44px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">sat</p>
    </div>
  );
}

function WeekBase6() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-start left-[316.33px] p-[4px] top-[190px] w-[38.472px]" data-name="Week Base">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[9px] text-center text-white uppercase">sun</p>
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute contents left-[35px] top-[190px]">
      <WeekBase />
      <WeekBase1 />
      <WeekBase2 />
      <WeekBase3 />
      <WeekBase4 />
      <WeekBase5 />
      <WeekBase6 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall() {
  return (
    <div className="absolute left-[91.51px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall1() {
  return (
    <div className="absolute left-[138.39px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group1 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall2() {
  return (
    <div className="absolute left-[185.28px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group2 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall3() {
  return (
    <div className="absolute left-[232.17px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group3 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall4() {
  return (
    <div className="absolute left-[279.06px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group4 />
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute contents left-[274.25px] top-[222.46px]">
      <div className="absolute left-[274.25px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <QuizStreakSmall4 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall5() {
  return (
    <div className="absolute left-[325.94px] overflow-clip size-[18.034px] top-[227.27px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group5 />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents left-[321.13px] top-[222.46px]">
      <div className="absolute left-[321.13px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <QuizStreakSmall5 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall6() {
  return (
    <div className="absolute left-[43.42px] overflow-clip size-[18.034px] top-[274.16px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group6 />
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute contents left-[38.61px] top-[269.35px]">
      <div className="absolute left-[38.61px] size-[27.652px] top-[269.35px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <QuizStreakSmall6 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute inset-[6.23%_16.68%_8.33%_16.67%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
        <g id="Group">
          <ellipse cx="7.1383" cy="10.147" fill="var(--fill-0, #FFCE51)" id="Ellipse 644" rx="2.81777" ry="3.94487" />
          <path d={svgPaths.pdbc1480} fill="var(--fill-0, #FF7324)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function QuizStreakSmall7() {
  return (
    <div className="absolute left-[90.3px] overflow-clip size-[18.034px] top-[274.16px]" data-name="Quiz / Streak / Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Group">
          <g id="Vector"></g>
        </g>
      </svg>
      <Group8 />
    </div>
  );
}

function Group16() {
  return (
    <div className="absolute contents left-[85.49px] top-[269.35px]">
      <div className="absolute left-[85.49px] size-[27.652px] top-[269.35px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <QuizStreakSmall7 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute contents left-[38.61px] top-[222.46px]">
      <div className="absolute left-[41.01px] size-[24.045px] top-[224.87px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
          <circle cx="12.0225" cy="12.0225" fill="var(--fill-0, #EDEFF1)" id="Ellipse 645" r="12.0225" />
        </svg>
      </div>
      <div className="absolute left-[86.7px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <div className="absolute left-[133.58px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <div className="absolute left-[180.47px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <div className="absolute left-[227.36px] size-[27.652px] top-[222.46px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
          <circle cx="13.8258" cy="13.8258" fill="var(--fill-0, #FFCE51)" id="Ellipse 646" r="13.8258" />
        </svg>
      </div>
      <QuizStreakSmall />
      <QuizStreakSmall1 />
      <QuizStreakSmall2 />
      <QuizStreakSmall3 />
      <Group13 />
      <Group14 />
      <Group15 />
      <Group16 />
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute contents left-[35px] top-[190px]">
      <Group11 />
      <div className="absolute bg-[rgba(255,206,81,0.2)] h-[37.27px] left-[79.48px] rounded-[35px] top-[217.65px] w-[274.112px]" />
      <Group12 />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#262135] overflow-clip relative rounded-[38px] size-full" data-name="Home">
      <div className="absolute left-[-100px] size-[359px] top-[-101px]">
        <div className="absolute inset-[-47.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 701 701">
            <g filter="url(#filter0_f_1_283)" id="Ellipse 1">
              <circle cx="350.5" cy="350.5" fill="var(--fill-0, #FBC6E6)" fillOpacity="0.08" r="179.5" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="701" id="filter0_f_1_283" width="701" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_283" stdDeviation="85.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <IOsStatusBarBlack />
      <Group7 />
      <div className="absolute font-['Montserrat_Alternates:SemiBold',sans-serif] h-[82px] leading-[1.08] left-[calc(50%-162px)] not-italic text-[36px] text-white top-[86px] w-[168px]">
        <p className="mb-0">Привіт!</p>
        <p>Андрій</p>
      </div>
      <p className="absolute font-['Montserrat_Alternates:SemiBold',sans-serif] h-[82px] leading-[1.08] left-[calc(50%-174px)] not-italic text-[28px] text-white top-[342px] w-[158px]">Ваш розклад</p>
      <p className="absolute font-['Montserrat_Alternates:Regular',sans-serif] h-[16px] leading-[1.08] left-[calc(50%-174px)] not-italic text-[14px] text-white top-[416px] w-[158px]">Сьогоднішня активність</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[16px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[16px] text-white top-[467px] w-[158px]">Розминка</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[16px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[13px] text-white top-[553px] w-[158px]">Жим лежачи</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[16px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[13px] text-white top-[625px] w-[158px]">Push Up</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[16px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[#948da9] text-[13px] top-[492px] w-[84px]">Біг 02 км</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[19px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[#948da9] text-[10px] top-[571px] w-[220px]">10 повторень, 3 підходи з 2-хв перервою</p>
      <p className="absolute font-['Montserrat_Alternates:Medium',sans-serif] h-[19px] leading-[1.08] left-[calc(50%-111px)] not-italic text-[#948da9] text-[10px] top-[643px] w-[166px]">20 reps , 3 sets with 10 sec rest</p>
      <div className="absolute bg-[#d6ebeb] h-[47px] left-[293px] rounded-[16px] top-[350px] w-[55px]" />
      <FilterList />
      <div className="absolute flex h-[198px] items-center justify-center left-[44px] top-[513px] w-0" style={{ "--transform-inner-width": "198", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[198px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 198 1">
                <line id="Line 29" stroke="var(--stroke-0, white)" strokeDasharray="4 4" strokeOpacity="0.35" x2="198" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[39px] size-[12px] top-[565px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #D3E8E8)" id="Ellipse 16" r="6" />
        </svg>
      </div>
      <div className="absolute left-[39px] size-[12px] top-[637px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #D3E8E8)" id="Ellipse 16" r="6" />
        </svg>
      </div>
      <div className="absolute bg-gradient-to-b from-[23.799%] from-[rgba(38,33,53,0)] h-[347px] left-0 to-[#262135] top-[497px] w-[390px]" />
      <div className="absolute left-[15px] size-[359px] top-[511px]">
        <div className="absolute inset-[-47.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 701 701">
            <g filter="url(#filter0_f_1_283)" id="Ellipse 1">
              <circle cx="350.5" cy="350.5" fill="var(--fill-0, #FBC6E6)" fillOpacity="0.08" r="179.5" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="701" id="filter0_f_1_283" width="701" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_283" stdDeviation="85.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <Group9 />
      <Group10 />
      <Group17 />
    </div>
  );
}