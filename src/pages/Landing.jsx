import React, { useEffect } from 'react';

const CSS = `
.landing-root * { box-sizing: border-box; }
body.landing-active { margin: 0; font-family: 'Onest', sans-serif; background: #F3F4F7; color: #18181B; }
.landing-root .accent { color: #ff0044; }
.landing-root .btn { display: inline-flex; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 14px; background: #ff0044; color: #fff; text-decoration: none; cursor: pointer; }
.landing-root .btn-2 { background: transparent; color: #18181B; border: 1.5px solid #D5D8E0; }

.landing-root .nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(15,23,42,0.06);
}
.landing-root .nav-inner {
  max-width: 1100px; margin: 0 auto;
  padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.landing-root .nav .logo img { height: 28px; display: block; }
.landing-root .nav .right { display: flex; align-items: center; gap: 6px; }
.landing-root .nav .login { color: #18181B; font-weight: 600; font-size: 13px; padding: 6px 10px; text-decoration: none; }
.landing-root .nav .cta { background: #ff0044; color: #fff; font-weight: 700; font-size: 13px; padding: 8px 14px; border-radius: 999px; text-decoration: none; }

.landing-root .stage { min-height: calc(100vh - 28px); padding: 32px 48px 40px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.landing-root .container { max-width: 1100px; margin: 0 auto; text-align: center; width: 100%; }
.landing-root h1 { font-size: clamp(32px, 4vw, 46px); line-height: 1.05; margin: 0 0 16px; font-weight: 900; letter-spacing: -0.025em; }
.landing-root h1 + p { font-size: 16px; margin: 0; color: #5C6076; max-width: 580px; margin-left: auto; margin-right: auto; line-height: 1.5; }
.landing-root .actions { display: flex; gap: 10px; justify-content: center; margin-top: 28px; }
.landing-root .micro { margin-top: 10px; font-size: 11px; color: #5C6076; letter-spacing: .04em; }
.landing-root .visual-wrap { margin: 36px 0 16px; padding-top: 14px; }
.landing-root .row { display: flex; justify-content: center; align-items: flex-end; gap: 12px; }
.landing-root .card { background: #fff; border-radius: 18px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); padding: 18px 16px; width: 160px; height: 200px; text-align: left; position: relative; }
.landing-root .bar { background: #E2E5EB; height: 6px; border-radius: 999px; margin-bottom: 7px; }
.landing-root .title { background: #18181B; height: 9px; width: 45%; margin-bottom: 10px; }
.landing-root .price { background: #18181B; height: 14px; width: 60%; margin-bottom: 14px; }
.landing-root .l1 { width: 90%; } .landing-root .l2 { width: 75%; } .landing-root .l3 { width: 80%; } .landing-root .l4 { width: 65%; }
.landing-root .btn-stub { position: absolute; bottom: 16px; left: 16px; right: 16px; height: 22px; border-radius: 999px; background: #18181B; }
.landing-root .card.feat { height: 230px; box-shadow: 0 18px 44px rgba(255,0,68,0.16); }
.landing-root .card.feat .title, .landing-root .card.feat .price, .landing-root .card.feat .btn-stub { background: #ff0044; }
.landing-root .featured-pill { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #ff0044; color: #fff; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }

.landing-root .reasons-intro .eyebrow { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #ff0044; margin-bottom: 24px; }
.landing-root .reasons-intro { padding: 200px 48px 80px; background: #fff; text-align: center; }
.landing-root .ri-inner { max-width: 900px; margin: 0 auto; }
.landing-root .reasons-intro h2 { font-size: clamp(36px, 4.5vw, 56px); line-height: 1.1; margin: 0; font-weight: 900; letter-spacing: -0.025em; }
.landing-root .rotator { display: inline-block; min-width: 280px; transition: opacity .35s ease; }

.landing-root .reason { padding: 140px 48px; background: #fff; }
.landing-root .reason-inner { max-width: 720px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; }
.landing-root .reason-num { font-size: 13px; font-weight: 800; letter-spacing: .24em; color: #ff0044; margin-bottom: 32px; }
.landing-root .reason h3 { font-size: clamp(32px, 3.6vw, 44px); line-height: 1.15; margin: 0 0 28px; font-weight: 900; letter-spacing: -0.025em; max-width: 640px; }
.landing-root .reason p { font-size: 17px; color: #5C6076; line-height: 1.6; margin: 0 0 80px; max-width: 560px; }
.landing-root .reason-vis { width: 100%; max-width: 560px; display: flex; align-items: center; justify-content: center; }

.landing-root .vis-doc { background: #fff; border-radius: 14px; padding: 28px; box-shadow: 0 24px 60px rgba(15,23,42,0.10); position: relative; height: 260px; width: 100%; max-width: 380px; overflow: hidden; }
.landing-root .vis-doc-line { background: #E2E5EB; height: 7px; border-radius: 999px; margin-bottom: 11px; }
.landing-root .vis-doc-line.t { background: #18181B; height: 11px; width: 40%; margin-bottom: 18px; }
.landing-root .vis-doc .w70 { width: 70%; } .landing-root .vis-doc .w80 { width: 80%; } .landing-root .vis-doc .w85 { width: 85%; } .landing-root .vis-doc .w90 { width: 90%; }
.landing-root .vis-doc-fade { position: absolute; bottom: 60px; left: 0; right: 0; height: 80px; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 80%); }
.landing-root .vis-doc-price { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); background: #FFE5EC; color: #ff0044; font-weight: 900; font-size: 18px; padding: 10px 22px; border-radius: 999px; box-shadow: 0 10px 24px rgba(255,0,68,0.20); }

.landing-root .vis-bubbles { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.landing-root .vb-row { display: flex; align-items: center; gap: 16px; }
.landing-root .vb-row.right { flex-direction: row-reverse; }
.landing-root .vb-emoji { width: 64px; height: 64px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
.landing-root .vb-emoji.bad { background: #FFE5EC; }
.landing-root .vb-emoji.good { background: #DCFCE7; }
.landing-root .vb-bubble { background: #fff; border-radius: 18px; padding: 16px 20px; box-shadow: 0 10px 28px rgba(15,23,42,0.08); position: relative; flex: 1; font-size: 15px; line-height: 1.45; color: #18181B; text-align: left; }
.landing-root .vb-bubble.bad { border: 1.5px solid #FFCAD5; }
.landing-root .vb-bubble.good { border: 1.5px solid #BBF7D0; }
.landing-root .vb-bubble.bad strong { color: #ff0044; }
.landing-root .vb-bubble.good strong { color: #16A34A; }
.landing-root .vb-bubble::after { content: ""; position: absolute; top: 22px; width: 0; height: 0; border-top: 9px solid transparent; border-bottom: 9px solid transparent; }
.landing-root .vb-row:not(.right) .vb-bubble::after { left: -11px; border-right: 11px solid #fff; }
.landing-root .vb-row.right .vb-bubble::after { right: -11px; border-left: 11px solid #fff; }
.landing-root .vb-divider { text-align: center; font-size: 11px; font-weight: 800; color: #94A3B8; letter-spacing: .22em; text-transform: uppercase; }

.landing-root .vis-compare { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.landing-root .vc-row { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.landing-root .vc-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; color: #94A3B8; }
.landing-root .vc-label.accent { color: #ff0044; }
.landing-root .vc-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
.landing-root .vc-pill { background: #F3F4F7; padding: 10px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #18181B; }
.landing-root .vc-pill.you { background: #18181B; color: #fff; }
.landing-root .vc-pill.ghost { color: #94A3B8; }
.landing-root .vc-pill.tier.picked { background: #ff0044; color: #fff; box-shadow: 0 8px 22px rgba(255,0,68,0.25); }
.landing-root .vc-arrow { color: #94A3B8; font-weight: 700; }
.landing-root .vc-arrow.accent { color: #ff0044; }

.landing-root .vis-stat-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: center; width: 100%; }
.landing-root .stat-block { text-align: center; }
.landing-root .stat-num { font-size: 120px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
.landing-root .stat-block.dim .stat-num { color: #E2E5EB; }
.landing-root .stat-block.hot .stat-num { color: #ff0044; }
.landing-root .stat-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .18em; color: #5C6076; margin-top: 12px; }
.landing-root .stat-vs { font-size: 14px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: .18em; }

.landing-root .vis-anchor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: end; width: 100%; }
.landing-root .va-card { background: #F3F4F7; border-radius: 14px; padding: 22px 14px; text-align: center; position: relative; }
.landing-root .va-card.va-mid { padding: 28px 14px; background: #fff; border: 2px solid #ff0044; box-shadow: 0 18px 44px rgba(255,0,68,0.18); }
.landing-root .va-card.va-prem { padding: 36px 14px; }
.landing-root .va-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #5C6076; margin-bottom: 10px; }
.landing-root .va-price { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; color: #18181B; }
.landing-root .va-card.va-mid .va-price { color: #ff0044; }
.landing-root .va-flag { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #ff0044; color: #fff; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; padding: 4px 10px; border-radius: 999px; }

.landing-root section { padding: 120px 48px; }
.landing-root section h2 { font-size: clamp(32px, 4vw, 46px); line-height: 1.1; margin: 0 0 16px; font-weight: 900; letter-spacing: -0.02em; }
.landing-root section .sub { font-size: 16px; color: #5C6076; max-width: 580px; margin: 0 auto 64px; line-height: 1.5; }
.landing-root .btn-full { display: block; text-align: center; margin-top: 24px; }
.landing-root .price-card .btn-full { margin-top: auto; padding: 14px 24px; }

.landing-root .roi { background: #F3F4F7; }
.landing-root .roi-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
.landing-root .roi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 18px 50px rgba(15,23,42,0.08); text-align: left; }
.landing-root .roi-controls { display: flex; flex-direction: column; gap: 24px; }
.landing-root .slider-row label { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; color: #18181B; margin-bottom: 10px; }
.landing-root .slider-row .val { color: #ff0044; font-weight: 800; }
.landing-root .slider-row input[type="range"] { width: 100%; -webkit-appearance: none; appearance: none; height: 4px; background: #E2E5EB; border-radius: 999px; outline: none; }
.landing-root .slider-row input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 999px; background: #ff0044; cursor: pointer; box-shadow: 0 4px 10px rgba(255,0,68,0.35); }
.landing-root .roi-output { display: flex; flex-direction: column; gap: 16px; }
.landing-root .out-card { background: #F3F4F7; border-radius: 14px; padding: 20px; }
.landing-root .out-card.highlight { background: #18181B; color: #fff; }
.landing-root .out-card.highlight .out-label { color: rgba(255,255,255,0.7); }
.landing-root .out-card.highlight .out-foot { color: rgba(255,255,255,0.5); }
.landing-root .out-label { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: #5C6076; font-weight: 700; margin-bottom: 8px; }
.landing-root .out-value { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
.landing-root .out-foot { font-size: 12px; color: #5C6076; }

.landing-root .earlybird { background: #FFF8E7; padding: 120px 24px; text-align: center; }
.landing-root .earlybird-inner { max-width: 1100px; margin: 0 auto; }
.landing-root .eb-eyebrow { display: inline-block; background: #18181B; color: #fff; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: .14em; margin-bottom: 28px; }
.landing-root .earlybird h2 { font-size: 56px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 16px; color: #18181B; }
.landing-root .earlybird h2 .accent { color: #ff0044; }
.landing-root .earlybird .sub { font-size: 18px; color: #5C6076; max-width: 580px; margin: 0 auto 48px; line-height: 1.5; }
.landing-root .eb-counter { max-width: 600px; margin: 0 auto 64px; }
.landing-root .eb-counter-bar { background: #fff; border-radius: 999px; height: 14px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); }
.landing-root .eb-counter-fill { background: linear-gradient(90deg, #ff0044, #ff5c8a); height: 100%; border-radius: 999px; }
.landing-root .eb-counter-text { font-size: 14px; color: #18181B; margin-top: 14px; font-weight: 500; }
.landing-root .eb-counter-text strong { font-weight: 800; }
.landing-root .eb-perks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 48px; text-align: left; }
.landing-root .eb-perk { background: #fff; border-radius: 20px; padding: 32px 24px; box-shadow: 0 8px 24px rgba(15,23,42,0.04); }
.landing-root .eb-perk-icon { font-size: 32px; margin-bottom: 14px; line-height: 1; }
.landing-root .eb-perk h3 { font-size: 17px; font-weight: 800; margin: 0 0 8px; color: #18181B; letter-spacing: -0.01em; }
.landing-root .eb-perk p { font-size: 14px; color: #5C6076; line-height: 1.5; margin: 0; }
@media (max-width: 900px) {
  .landing-root .eb-perks { grid-template-columns: repeat(2, 1fr); }
  .landing-root .earlybird h2 { font-size: 40px; }
}

.landing-root .pricing { background: #fff; }
.landing-root .pricing-inner { max-width: 1180px; margin: 0 auto; text-align: center; }
.landing-root .beta-ribbon { display: inline-block; background: #FFE5EC; color: #ff0044; font-weight: 700; font-size: 13px; padding: 8px 18px; border-radius: 999px; margin-bottom: 32px; }
.landing-root .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
.landing-root .price-card { background: #F3F4F7; border-radius: 24px; padding: 36px 28px; text-align: left; position: relative; display: flex; flex-direction: column; }
.landing-root .price-card.popular { background: #18181B; color: #fff; box-shadow: 0 24px 60px rgba(255,0,68,0.25); transform: translateY(-12px); }
.landing-root .card-top-slot { min-height: 28px; margin-bottom: 12px; display: flex; align-items: center; }
.landing-root .popular-flag { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #ff0044; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; padding: 6px 14px; border-radius: 999px; }
.landing-root .tier-name { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 4px; }
.landing-root .tier-tagline { font-size: 13px; color: #5C6076; margin-bottom: 24px; }
.landing-root .price-card.popular .tier-tagline { color: rgba(255,255,255,0.6); }
.landing-root .tier-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
.landing-root .tp-num { font-size: 56px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
.landing-root .tp-mo { font-size: 16px; color: #5C6076; font-weight: 600; }
.landing-root .price-card.popular .tp-mo { color: rgba(255,255,255,0.6); }
.landing-root .tier-was { font-size: 13px; color: #5C6076; text-decoration: line-through; margin-bottom: 24px; }
.landing-root .price-card.popular .tier-was { color: rgba(255,255,255,0.4); }
.landing-root .tier-was-empty { visibility: hidden; text-decoration: none; }
.landing-root .seats-badge { display: inline-block; background: #FFE5EC; color: #ff0044; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; padding: 5px 10px; border-radius: 999px; }
.landing-root .cs-tag { display: inline-block; background: #E2E5EB; color: #5C6076; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; padding: 2px 7px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
.landing-root .price-card.popular .cs-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }

.landing-root .tt { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #E2E5EB; color: #5C6076; cursor: help; position: relative; margin-left: 4px; vertical-align: middle; }
.landing-root .tt svg { display: block; }
.landing-root .price-card.popular .tt { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.85); }
.landing-root .tt:hover::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #18181B; color: #fff; font-size: 12px; font-weight: 500; line-height: 1.4; padding: 8px 12px; border-radius: 8px; width: 240px; white-space: normal; z-index: 10; text-align: left; pointer-events: none; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
.landing-root .tt:hover::before { content: ""; position: absolute; bottom: calc(100% + 1px); left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #18181B; z-index: 10; pointer-events: none; }

.landing-root .bill-toggle { display: inline-flex; gap: 4px; padding: 4px; background: #F3F4F7; border-radius: 999px; margin: 24px auto 0; }
.landing-root .bt { border: 0; background: transparent; cursor: pointer; font-size: 14px; font-weight: 700; color: #5C6076; padding: 8px 18px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; transition: all .2s; font-family: inherit; }
.landing-root .bt.active { background: #18181B; color: #fff; }
.landing-root .bt-save { background: #ff0044; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .1em; }

.landing-root .tier-addon { font-size: 13px; color: #5C6076; padding: 10px 0 4px; border-top: 1px dashed #E2E5EB; margin-top: 4px; }
.landing-root .tier-addon strong { color: #18181B; font-weight: 700; }
.landing-root .tier-feats { list-style: none; padding: 0; margin: 0 0 8px; }
.landing-root .tier-feats li { font-size: 14px; color: #18181B; padding: 8px 0; border-bottom: 1px solid #E2E5EB; position: relative; padding-left: 22px; }
.landing-root .tier-feats li::before { content: "✓"; position: absolute; left: 0; color: #ff0044; font-weight: 800; }
.landing-root .price-card.popular .tier-feats li { color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.1); }
.landing-root .price-foot { margin-top: 32px; font-size: 13px; color: #5C6076; }

.landing-root .how { background: #F3F4F7; }
.landing-root .how-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
.landing-root .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 32px; }
.landing-root .step { background: #fff; border-radius: 24px; padding: 40px 32px; text-align: left; box-shadow: 0 14px 40px rgba(15,23,42,0.06); }
.landing-root .step-num { width: 44px; height: 44px; border-radius: 999px; background: #ff0044; color: #fff; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.landing-root .step-title { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 8px; }
.landing-root .step-body { font-size: 15px; color: #5C6076; line-height: 1.5; }

.landing-root .faq { background: #F3F4F7; }
.landing-root .faq-inner { max-width: 760px; margin: 0 auto; text-align: center; }
.landing-root .faq-list { text-align: left; margin-top: 32px; }
.landing-root .faq-item { background: #fff; border-radius: 14px; padding: 22px 26px; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(15,23,42,0.04); }
.landing-root .faq-item summary { cursor: pointer; font-weight: 700; font-size: 16px; color: #18181B; list-style: none; display: flex; justify-content: space-between; align-items: center; }
.landing-root .faq-item summary::after { content: "+"; color: #ff0044; font-size: 22px; font-weight: 400; transition: transform .2s; }
.landing-root .faq-item[open] summary::after { content: "−"; }
.landing-root .faq-item div { margin-top: 14px; font-size: 15px; color: #5C6076; line-height: 1.6; }

.landing-root .final-cta { background: #18181B; color: #fff; text-align: center; }
.landing-root .fc-inner { max-width: 760px; margin: 0 auto; }
.landing-root .final-cta h2 { color: #fff; }
.landing-root .final-cta .sub { color: rgba(255,255,255,0.6); }
.landing-root .final-cta .micro { margin-top: 16px; color: rgba(255,255,255,0.45); font-size: 12px; letter-spacing: .04em; }

.landing-root .footer { background: #18181B; padding: 40px 48px 48px; border-top: 1px solid rgba(255,255,255,0.08); }
.landing-root .foot-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
.landing-root .foot-logo img { height: 24px; opacity: 0.85; filter: brightness(0) invert(1); }
.landing-root .foot-links { display: flex; gap: 24px; }
.landing-root .foot-links a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; font-weight: 500; }
.landing-root .foot-links a:hover { color: #fff; }
.landing-root .foot-copy { color: rgba(255,255,255,0.4); font-size: 12px; }

.landing-root .ig-float { position: fixed; bottom: 24px; right: 24px; z-index: 100; background: #ff0044; color: #fff; text-decoration: none; width: 56px; height: 56px; border-radius: 999px; box-shadow: 0 14px 40px rgba(255,0,68,0.4); display: flex; align-items: center; justify-content: center; transition: transform .2s, box-shadow .2s; }
.landing-root .ig-float:hover { transform: translateY(-2px); box-shadow: 0 18px 50px rgba(255,0,68,0.5); }
.landing-root .ig-float svg { display: block; }

.landing-root section .eyebrow { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #ff0044; margin-bottom: 16px; }
`;

const TT_SVG = '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 1.4A5.1 5.1 0 1 1 8 13.1 5.1 5.1 0 0 1 8 2.9zM8 6.5a.85.85 0 0 0-.85.85v3.1a.85.85 0 0 0 1.7 0V7.35A.85.85 0 0 0 8 6.5zm0-2.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>';

const HTML = `
<nav class="nav">
  <div class="nav-inner">
    <div class="logo">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png" alt="LaunchBox" />
    </div>
    <div class="right">
      <a class="login" href="/Welcome">Log in</a>
      <a class="cta" href="/Welcome?signup=1">Start free trial</a>
    </div>
  </div>
</nav>

<div class="stage">
  <div class="container">
    <h1>Turn proposals into <span class="accent">interactive packages</span></h1>
    <p>LaunchBox turns your boring offers into beautiful packages that naturally sell at a higher price.</p>
    <div class="visual-wrap">
      <div class="row">
        <div class="card"><div class="bar title"></div><div class="bar price"></div><div class="bar l1"></div><div class="bar l2"></div><div class="bar l3"></div><div class="btn-stub"></div></div>
        <div class="card feat"><span class="featured-pill">Most popular</span><div class="bar title"></div><div class="bar price"></div><div class="bar l1"></div><div class="bar l2"></div><div class="bar l3"></div><div class="bar l4"></div><div class="btn-stub"></div></div>
        <div class="card"><div class="bar title"></div><div class="bar price"></div><div class="bar l1"></div><div class="bar l2"></div><div class="bar l3"></div><div class="btn-stub"></div></div>
      </div>
    </div>
    <div class="actions">
      <a class="btn" href="/Welcome?signup=1">Build my first package free →</a>
    </div>
  </div>
</div>

<section class="reasons-intro">
  <div class="ri-inner">
    <div class="eyebrow">Why packages win</div>
    <h2>5 reasons packages win over<br /><span class="rotator accent">proposals</span></h2>
  </div>
</section>

<section class="reason">
  <div class="reason-inner">
    <div class="reason-num">01</div>
    <h3>Long quotes are confusing.</h3>
    <p>Confused clients don't buy. They just scroll to the bottom, look for the price, and end up price shopping.</p>
    <div class="reason-vis">
      <div class="vis-doc">
        <div class="vis-doc-line t"></div>
        <div class="vis-doc-line w90"></div>
        <div class="vis-doc-line w80"></div>
        <div class="vis-doc-line w90"></div>
        <div class="vis-doc-line w70"></div>
        <div class="vis-doc-line w85"></div>
        <div class="vis-doc-line w80"></div>
        <div class="vis-doc-fade"></div>
        <div class="vis-doc-price">$2,500 ?</div>
      </div>
    </div>
  </div>
</section>

<section class="reason">
  <div class="reason-inner">
    <div class="reason-num">02</div>
    <h3>People feel you're screwing them over.</h3>
    <p>A custom price feels made up. They wonder what you're hiding. A package feels like buying a product. They think "oh, those are their prices," not "why did they price this for me?"</p>
    <div class="reason-vis">
      <div class="vis-bubbles">
        <div class="vb-row">
          <div class="vb-emoji bad">🤨</div>
          <div class="vb-bubble bad">"Wait, why is <strong>mine $2,500</strong> and Bob's was $1,800? What are they hiding?"</div>
        </div>
        <div class="vb-divider">vs.</div>
        <div class="vb-row right">
          <div class="vb-emoji good">😌</div>
          <div class="vb-bubble good">"Oh, those are <strong>their prices</strong>. Let me pick one."</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="reason">
  <div class="reason-inner">
    <div class="reason-num">03</div>
    <h3>Clients compare you to competitors.</h3>
    <p>Give clients one option, they compare you to others. Give them a few options, they compare the options to each other.</p>
    <div class="reason-vis">
      <div class="vis-compare">
        <div class="vc-row">
          <div class="vc-label">One offer</div>
          <div class="vc-flow">
            <div class="vc-pill you">You</div>
            <div class="vc-arrow">↔</div>
            <div class="vc-pill ghost">Competitor</div>
            <div class="vc-arrow">↔</div>
            <div class="vc-pill ghost">Competitor</div>
          </div>
        </div>
        <div class="vc-row">
          <div class="vc-label accent">Three options</div>
          <div class="vc-flow">
            <div class="vc-pill tier">Basic</div>
            <div class="vc-arrow accent">↔</div>
            <div class="vc-pill tier picked">Pro</div>
            <div class="vc-arrow accent">↔</div>
            <div class="vc-pill tier">Elite</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="reason">
  <div class="reason-inner">
    <div class="reason-num">04</div>
    <h3>You give clients no options.</h3>
    <p>It's proven. People are much more likely to pick when given options instead of just yes or no.</p>
    <div class="reason-vis">
      <div class="vis-stat-grid">
        <div class="stat-block dim">
          <div class="stat-num">1</div>
          <div class="stat-label">Option</div>
        </div>
        <div class="stat-vs">vs</div>
        <div class="stat-block hot">
          <div class="stat-num">3</div>
          <div class="stat-label">Options</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="reason">
  <div class="reason-inner">
    <div class="reason-num">05</div>
    <h3>You leave money on the table.</h3>
    <p>Without a higher tier, your price looks like the ceiling. Add one, and the same price suddenly looks like a deal.</p>
    <div class="reason-vis">
      <div class="vis-anchor">
        <div class="va-card"><div class="va-name">Basic</div><div class="va-price">$1,500</div></div>
        <div class="va-card va-mid">
          <div class="va-flag">Smart pick</div>
          <div class="va-name">Pro</div><div class="va-price">$2,500</div>
        </div>
        <div class="va-card va-prem"><div class="va-name">Elite</div><div class="va-price">$4,500</div></div>
      </div>
    </div>
  </div>
</section>

<section class="roi">
  <div class="roi-inner">
    <div class="eyebrow">The math on you</div>
    <h2>How much money are you <span class="accent">leaving on the table?</span></h2>
    <p class="sub">Slide the inputs to your numbers. We'll show what changes when clients self-select a tier.</p>
    <div class="roi-grid">
      <div class="roi-controls">
        <div class="slider-row"><label>Quotes you send per month <span class="val" id="v1">20</span></label><input type="range" min="1" max="100" value="20" id="s1" /></div>
        <div class="slider-row"><label>Average deal value <span class="val" id="v2">$2,500</span></label><input type="range" min="500" max="20000" step="100" value="2500" id="s2" /></div>
        <div class="slider-row"><label>Current close rate <span class="val" id="v3">25%</span></label><input type="range" min="5" max="80" value="25" id="s3" /></div>
        <div class="slider-row"><label>Hours per quote <span class="val" id="v4">2 hrs</span></label><input type="range" min="0.5" max="8" step="0.5" value="2" id="s4" /></div>
      </div>
      <div class="roi-output">
        <div class="out-card"><div class="out-label">Extra revenue per month</div><div class="out-value accent" id="oRev">+$6,250</div><div class="out-foot">From higher close rate + premium tier mix</div></div>
        <div class="out-card"><div class="out-label">Hours saved per month</div><div class="out-value" id="oHrs">30 hrs</div><div class="out-foot">Build once, send forever</div></div>
        <div class="out-card highlight"><div class="out-label">Annual revenue lift</div><div class="out-value accent" id="oYear">+$75,000</div><div class="out-foot">At your current numbers</div></div>
      </div>
    </div>
  </div>
</section>

<section class="earlybird">
  <div class="earlybird-inner">
    <div class="eb-eyebrow">🐦 Early-bird launch</div>
    <h2>Get in early. <span class="accent">Get the perks.</span></h2>
    <p class="sub">The first 600 users get the early-bird deal. After that, prices go up.</p>
    <div class="eb-counter">
      <div class="eb-counter-bar"><div class="eb-counter-fill" style="width: 78%"></div></div>
      <div class="eb-counter-text"><strong>468 of 600</strong> early-bird spots taken &nbsp;·&nbsp; <strong>132 left</strong></div>
    </div>
    <div class="eb-perks">
      <div class="eb-perk"><div class="eb-perk-icon">💸</div><h3>Lower price</h3><p>Starter $19 instead of $29. Growth $39 instead of $49.</p></div>
      <div class="eb-perk"><div class="eb-perk-icon">🔒</div><h3>Locked for 1 year</h3><p>Your price stays the same for 12 months. No surprise hikes.</p></div>
      <div class="eb-perk"><div class="eb-perk-icon">⚡</div><h3>Fast support</h3><p>Direct line to me. Real human, real answers, fast.</p></div>
      <div class="eb-perk"><div class="eb-perk-icon">🗳️</div><h3>Vote on the roadmap</h3><p>Your feature requests get priority. You shape what gets built next.</p></div>
    </div>
    <a class="btn" href="#pricing">Lock in my price →</a>
  </div>
</section>

<section class="pricing" id="pricing">
  <div class="pricing-inner">
    <div class="beta-ribbon">🐦 468 of 600 early-bird spots taken — lock today's price for 1 year</div>
    <div class="eyebrow">Pricing</div>
    <h2>Pick your plan. <span class="accent">Cancel anytime.</span></h2>
    <p class="sub">7-day free trial. No credit card required.</p>
    <div class="bill-toggle">
      <button class="bt active" data-period="monthly">Monthly</button>
      <button class="bt" data-period="annual">Annual <span class="bt-save">save 17%</span></button>
    </div>
    <div class="price-grid">
      <div class="price-card" data-monthly="19" data-annual="190" data-regular="29">
        <div class="card-top-slot"></div>
        <div class="tier-name">Starter</div>
        <div class="tier-tagline">For solo operators</div>
        <div class="tier-price"><span class="tp-num">$19</span><span class="tp-mo">/mo</span></div>
        <div class="tier-was">Regular $29/mo</div>
        <ul class="tier-feats">
          <li>5 packages per month</li>
          <li>Embed on your website</li>
          <li>Contracts + e-signature</li>
          <li>Real-time view alerts</li>
          <li>Cost calculator</li>
          <li>All templates + custom branding</li>
        </ul>
        <a class="btn btn-2 btn-full" href="/Welcome?signup=1&plan=starter">Start free trial</a>
      </div>
      <div class="price-card popular" data-monthly="39" data-annual="390" data-regular="49">
        <div class="card-top-slot"><div class="popular-flag">Most popular</div></div>
        <div class="tier-name">Growth</div>
        <div class="tier-tagline">Build packages with AI in 60 seconds</div>
        <div class="tier-price"><span class="tp-num">$39</span><span class="tp-mo">/mo</span></div>
        <div class="tier-was">Regular $49/mo</div>
        <ul class="tier-feats">
          <li>Everything in Starter</li>
          <li>Unlimited packages</li>
          <li>Smart pricing alerts <span class="tt" data-tip="Real-time warnings when your tier ratios break the psychology of anchored pricing — stops you from underpricing your premium tier.">${TT_SVG}</span></li>
          <li>Auto Packages <span class="tt" data-tip="Your client takes a quick quiz, and packages auto-generate based on their answers.">${TT_SVG}</span> <span class="cs-tag">soon</span></li>
          <li>AI Package Generator <span class="tt" data-tip="Generate a 3-tier package from a sentence, a Zoom call transcript, or your existing quote file.">${TT_SVG}</span> <span class="cs-tag">soon</span></li>
          <li>Pricing benchmarks <span class="tt" data-tip="See how your prices compare to others in your industry.">${TT_SVG}</span> <span class="cs-tag">soon</span></li>
          <li>CRM integration <span class="tt" data-tip="Push won deals into GoHighLevel, HubSpot, or Pipedrive.">${TT_SVG}</span> <span class="cs-tag">soon</span></li>
        </ul>
        <a class="btn btn-full" href="/Welcome?signup=1&plan=growth">Start free trial</a>
      </div>
      <div class="price-card" data-monthly="199" data-annual="1990">
        <div class="card-top-slot"><div class="seats-badge">5 team seats included</div></div>
        <div class="tier-name">Pro</div>
        <div class="tier-tagline">For agencies and teams</div>
        <div class="tier-price"><span class="tp-num">$199</span><span class="tp-mo">/mo</span></div>
        <div class="tier-was tier-was-empty">&nbsp;</div>
        <ul class="tier-feats">
          <li>Everything in Growth</li>
          <li>Multi-brand workspaces <span class="tt" data-tip="Manage packages for multiple brands or clients from one account.">${TT_SVG}</span></li>
          <li>A/B package testing <span class="tt" data-tip="Send two versions of a package and see which closes better.">${TT_SVG}</span> <span class="cs-tag">soon</span></li>
          <li>Your designated packaging expert — monthly 1-on-1 call</li>
        </ul>
        <div class="tier-addon">Need more? <strong>+$30/seat/mo</strong></div>
        <a class="btn btn-2 btn-full" href="/Welcome?signup=1&plan=pro">Start free trial</a>
      </div>
    </div>
    <div class="price-foot">All plans include early-bird perks: fast support, feature votes, 1-year price lock.</div>
  </div>
</section>

<section class="how">
  <div class="how-inner">
    <div class="eyebrow">How it works</div>
    <h2>Three steps. <span class="accent">No design or code.</span></h2>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-title">Build your packages</div><div class="step-body">Pick a template, drag in your services, set tier prices. Or start from scratch in 10 minutes.</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-title">Send the link</div><div class="step-body">No PDFs. No attachments. One link your clients can open on any device, any time.</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-title">Get paid</div><div class="step-body">Clients pick a tier, customize, and pay. You get notified the moment they decide.</div></div>
    </div>
  </div>
</section>

<section class="faq">
  <div class="faq-inner">
    <div class="eyebrow">Questions</div>
    <h2>Things you're <span class="accent">probably wondering.</span></h2>
    <div class="faq-list">
      <details class="faq-item"><summary>How long does it take to set up?</summary><div>Most users build their first package in under 10 minutes using a template. From scratch, 20-30 minutes the first time, then 5 minutes per package.</div></details>
      <details class="faq-item"><summary>Why packages instead of quotes?</summary><div>When you send a quote, clients compare you to competitors. When you send packages, they compare the options to each other. Result: higher close rate, zero negotiation.</div></details>
      <details class="faq-item"><summary>What happens to my price after the early-bird year?</summary><div>Lock in the early-bird rate today and you keep that price for 12 months. No surprise hikes.</div></details>
      <details class="faq-item"><summary>Can I cancel anytime?</summary><div>Yes. Cancel from your dashboard with one click. We'll email you before your card is charged at the end of any trial.</div></details>
      <details class="faq-item"><summary>Is this for my industry?</summary><div>If you sell services (1-on-1 or recurring) and quote clients, yes. We have templates for photography, video, HVAC, MSP, with more shipping weekly. Custom industries work fine — start from a blank package.</div></details>
    </div>
  </div>
</section>

<section class="final-cta">
  <div class="fc-inner">
    <h2>Stop sending quotes.<br /><span class="accent">Start sending packages.</span></h2>
    <p class="sub">7-day free trial. Lock early-bird pricing. We'll email before your card is charged.</p>
    <div class="actions">
      <a class="btn" href="/Welcome?signup=1">Build my first package free →</a>
    </div>
    <div class="micro">No credit card today · Cancel anytime</div>
  </div>
</section>

<footer class="footer">
  <div class="foot-inner">
    <div class="foot-logo">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png" alt="LaunchBox" />
    </div>
    <div class="foot-links">
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="mailto:aviv@launch-box.io">Contact</a>
    </div>
    <div class="foot-copy">© 2026 LaunchBox. Made with care.</div>
  </div>
</footer>

<a class="ig-float" href="https://www.instagram.com/aviv_ben_or/" target="_blank" rel="noopener" aria-label="DM Aviv on Instagram">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
</a>
`;

export default function Landing() {
  useEffect(() => {
    document.body.classList.add('landing-active');

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;700;800;900&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    let rotInterval;
    const rotEl = document.querySelector('.rotator');
    if (rotEl) {
      const words = ['proposals', 'quotes', 'estimates', 'offers'];
      let i = 0;
      rotInterval = setInterval(() => {
        rotEl.style.opacity = '0';
        setTimeout(() => {
          i = (i + 1) % words.length;
          rotEl.textContent = words[i];
          rotEl.style.opacity = '1';
        }, 350);
      }, 2200);
    }

    const s1 = document.getElementById('s1');
    const s2 = document.getElementById('s2');
    const s3 = document.getElementById('s3');
    const s4 = document.getElementById('s4');
    const v1 = document.getElementById('v1');
    const v2 = document.getElementById('v2');
    const v3 = document.getElementById('v3');
    const v4 = document.getElementById('v4');
    const oRev = document.getElementById('oRev');
    const oHrs = document.getElementById('oHrs');
    const oYear = document.getElementById('oYear');

    let calc;
    if (s1 && s2 && s3 && s4) {
      const fmt = (n) => '$' + Math.round(n).toLocaleString();
      calc = () => {
        const quotes = +s1.value;
        const deal = +s2.value;
        const close = +s3.value / 100;
        const hrs = +s4.value;
        const liftCloseRate = Math.min(close * 1.25, 0.95);
        const liftDealValue = deal * 1.20;
        const currentRev = quotes * close * deal;
        const lbRev = quotes * liftCloseRate * liftDealValue;
        const extra = lbRev - currentRev;
        const saved = quotes * (hrs - 0.25);
        v1.textContent = quotes;
        v2.textContent = fmt(deal);
        v3.textContent = Math.round(close * 100) + '%';
        v4.textContent = hrs + ' hrs';
        oRev.textContent = '+' + fmt(extra);
        oHrs.textContent = Math.round(saved) + ' hrs';
        oYear.textContent = '+' + fmt(extra * 12);
      };
      [s1, s2, s3, s4].forEach((s) => s.addEventListener('input', calc));
      calc();
    }

    const btns = document.querySelectorAll('.bt');
    const cards = document.querySelectorAll('.price-card');
    const setPeriod = (period) => {
      btns.forEach((b) => b.classList.toggle('active', b.dataset.period === period));
      cards.forEach((card) => {
        const m = +card.dataset.monthly;
        const a = +card.dataset.annual;
        const r = card.dataset.regular ? +card.dataset.regular : null;
        const num = card.querySelector('.tp-num');
        const mo = card.querySelector('.tp-mo');
        const was = card.querySelector('.tier-was');
        if (period === 'monthly') {
          num.textContent = '$' + m;
          mo.textContent = '/mo';
          if (was) {
            if (r === null) {
              was.innerHTML = '&nbsp;';
              was.classList.add('tier-was-empty');
            } else {
              was.textContent = 'Regular $' + r + '/mo';
              was.classList.remove('tier-was-empty');
            }
          }
        } else {
          const monthlyEq = Math.round(a / 12);
          num.textContent = '$' + monthlyEq;
          mo.textContent = '/mo billed yearly';
          if (was) {
            was.textContent = '$' + a + '/year · save 17%';
            was.classList.remove('tier-was-empty');
          }
        }
      });
    };
    const btnHandlers = [];
    btns.forEach((b) => {
      const handler = () => setPeriod(b.dataset.period);
      b.addEventListener('click', handler);
      btnHandlers.push([b, handler]);
    });

    return () => {
      document.body.classList.remove('landing-active');
      if (rotInterval) clearInterval(rotInterval);
      if (calc) [s1, s2, s3, s4].forEach((s) => s && s.removeEventListener('input', calc));
      btnHandlers.forEach(([b, h]) => b.removeEventListener('click', h));
      if (fontLink.parentNode) fontLink.parentNode.removeChild(fontLink);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="landing-root" dangerouslySetInnerHTML={{ __html: HTML }} />
    </>
  );
}
