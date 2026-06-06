// Each skill: { id, name, mpCost, target: "enemy"|"self"|"all", fn(user, target) → { damage, heal, effect, msg } }

export const SKILLS = {
  // ── Archer ──
  double_shot: {
    id: "double_shot",
    name: "Double Shot",
    mpCost: 8,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor((user.atk * 0.7 - target.def * 0.3) * 2);
      const damage = Math.max(2, dmg);
      return { damage, msg: `${user.name} fires two arrows! (${damage} dmg)` };
    },
  },
  rain_of_arrows: {
    id: "rain_of_arrows",
    name: "Rain of Arrows",
    mpCost: 20,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor((user.atk * 1.8 - target.def * 0.5));
      const damage = Math.max(5, dmg);
      return { damage, msg: `${user.name} rains arrows! (${damage} dmg)` };
    },
  },
  focus: {
    id: "focus",
    name: "Focus",
    mpCost: 10,
    target: "self",
    fn(user) {
      user._focusedTurns = 2;
      return { effect: "focus_buff", msg: `${user.name} focuses... ATK up for 2 turns!` };
    },
  },
  evade: {
    id: "evade",
    name: "Evade",
    mpCost: 6,
    target: "self",
    fn(user) {
      user._evasion = true;
      return { effect: "evade", msg: `${user.name} prepares to evade the next attack!` };
    },
  },

  // ── Knight ──
  shield_bash: {
    id: "shield_bash",
    name: "Shield Bash",
    mpCost: 6,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor(user.atk * 0.9 - target.def * 0.4);
      const damage = Math.max(1, dmg);
      target._stunned = true;
      return { damage, effect: "stun", msg: `${user.name} bashes with shield! (${damage} dmg, stunned!)` };
    },
  },
  fortify: {
    id: "fortify",
    name: "Fortify",
    mpCost: 8,
    target: "self",
    fn(user) {
      user._fortified = 2;
      return { effect: "def_buff", msg: `${user.name} fortifies! DEF greatly increased for 2 turns.` };
    },
  },
  war_cry: {
    id: "war_cry",
    name: "War Cry",
    mpCost: 12,
    target: "self",
    fn(user) {
      user._warCry = 3;
      return { effect: "atk_buff", msg: `${user.name} lets out a War Cry! ATK up for 3 turns!` };
    },
  },
  cleave: {
    id: "cleave",
    name: "Cleave",
    mpCost: 16,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor(user.atk * 2 - target.def * 0.3);
      const damage = Math.max(5, dmg);
      return { damage, msg: `${user.name} cleaves! (${damage} dmg)` };
    },
  },

  // ── Wizard ──
  fireball: {
    id: "fireball",
    name: "Fireball",
    mpCost: 14,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor(user.atk * 1.5 - target.def * 0.2);
      const damage = Math.max(4, dmg);
      return { damage, effect: "fire", msg: `${user.name} casts Fireball! (${damage} dmg)` };
    },
  },
  ice_shard: {
    id: "ice_shard",
    name: "Ice Shard",
    mpCost: 10,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor(user.atk - target.def * 0.1);
      const damage = Math.max(2, dmg);
      target._slowed = 2;
      return { damage, effect: "ice", msg: `${user.name} hurls Ice Shard! (${damage} dmg, slowed!)` };
    },
  },
  thunder: {
    id: "thunder",
    name: "Thunder",
    mpCost: 22,
    target: "enemy",
    fn(user, target) {
      const dmg = Math.floor(user.atk * 2.2 - target.def * 0.15);
      const damage = Math.max(8, dmg);
      return { damage, msg: `${user.name} calls Thunder! (${damage} dmg)` };
    },
  },
  heal: {
    id: "heal",
    name: "Heal",
    mpCost: 18,
    target: "self",
    fn(user) {
      const amount = Math.floor(user.maxHp * 0.35);
      user.hp = Math.min(user.maxHp, user.hp + amount);
      return { heal: amount, msg: `${user.name} heals for ${amount} HP!` };
    },
  },
};
