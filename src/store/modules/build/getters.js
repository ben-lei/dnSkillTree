import parameterize from '../../../lib/parameterize';
import Level from '../../../lib/level';

export default {
  spTotals(state, getters, State, Getters) {
    const levels = state.levels;
    const skills = Getters.skills;
    const tree = Getters.tree;
    const sp = [0, 0, 0];
    let index = -1;

    for (let i = 0, slot = 0; i < levels.length; i += 1, slot = i % 24) {
      const level = levels[i];

      if (slot === 0) {
        index += 1;
      }

      if (typeof level === 'number') {
        const skill = skills[tree[index][slot]];
        const job = skill.job;

        sp[job] += skill.spTotal[level];
      }
    }

    return sp;
  },

  spTotal(state, getters) {
    const spTotals = getters.spTotals;
    return spTotals[0] + spTotals[1] + spTotals[2];
  },

  active(state, getters, State, Getters) {
    if (state.active === -1 && Getters.tree.length) {
      const tree = Getters.tree[0];
      for (let i = 0; i < 4; i += 1) {
        if (tree[i] !== null) {
          return tree[i];
        }
      }
    }

    return state.active;
  },

  activeAlt(state, getters) {
    return state.activeAlt === -1 ? getters.active : state.activeAlt;
  },

  skill: (state, getters, State, Getters) => Getters.skills[getters.active],
  skillAlt: (state, getters, State, Getters) => Getters.skills[getters.activeAlt],

  name: (state, getters, State, Getters) => Getters.messages[getters.skillAlt.name],

  level: (state, getters) => Level.valueOf(state.levels, getters.skill),

  index: (state, getters) => Level.indexOf(getters.level),

  ascendancyTechs(state, getters, State, Getters) {
    const ascendancies = [];
    const techs = state.techs;
    const skills = Getters.skills;

    if (state.crestTech !== -1) {
      ascendancies[skills[state.crestTech].job] = 1;
    }

    techs.forEach((tech) => {
      if (tech !== -1) {
        const skill = skills[tech];

        if (!ascendancies[skill.job]) {
          ascendancies[skill.job] = 0;
        }

        ascendancies[skill.job] += 1;
      }
    });

    return ascendancies;
  },

  techCount(state, getters) {
    const skillId = getters.active;
    let count = 0;

    if (state.crestTech === skillId) {
      count += 1;
    }

    if (state.techs.indexOf(skillId) !== -1) {
      count += 1;
    }

    return Math.min(getters.skill.spMaxLevel, count);
  },

  meta(state, getters) {
    const skill = getters.skill;
    const skillAlt = getters.skillAlt;
    const techCount = getters.techCount;
    const level = Math.max(1, getters.level);
    const index = Level.indexOf(level);
    const techIndex = index + techCount;

    const maxLevel = skill.maxLevel - skill.spMaxLevel;
    const spTotal = getters.level ? skill.spTotal[index] : 0;
    const hp = skillAlt.hp[state.mode][techIndex];
    const mp = skillAlt.mp[state.mode][techIndex];
    const cd = skillAlt.cdOverride ?
      skillAlt.cdOverride[state.mode] : skillAlt.cd[state.mode][techIndex];

    return {
      level,
      maxLevel,
      spTotal,
      hp,
      mp,
      cd,
    };
  },

  type(state, getters) {
    const type = getters.skillAlt.type;
    const durationType = getters.skillAlt.durationType;

    if (!type) {
      switch (durationType) {
        case 0:
          return 'Instant';
        case 1:
          return 'Buff';
        case 2:
          return 'Debuff';
        default:
          break;
      }
    } else if (type === 3) {
      return 'Passive Enhanced';
    }

    return 'Passive';
  },

  attribute(state, getters) {
    switch (getters.skillAlt.element) {
      case 0:
        return 'Fire';
      case 1:
        return 'Water';
      case 2:
        return 'Light';
      case 3:
        return 'Dark';
      default:
        break;
    }

    return 'None';
  },

  weapons(state, getters, State, Getters) {
    const weapons = getters.skill.weapons;
    const messages = Getters.messages;
    const weaponMap = Getters.weaponMap;

    if (weapons) {
      return weapons.map(n => messages[weaponMap[n]]);
    }

    return null;
  },

  next(state, getters, State, Getters) {
    const levels = state.levels;
    const level = getters.level;
    const skills = Getters.skills;
    const skill = getters.skill;
    const parents = skill.parents ?
      skill.parents
        .filter(parent => Level.valueOf(levels, skills[parent.id]) < parent.level)
      : null;

    let levelReq = 0;
    let spCost = 0;

    if (level >= skill.maxLevel) {
      const maxLevelIndex = Level.indexOf(skill.maxLevel);
      levelReq = skill.levelReq[maxLevelIndex];
      spCost = skill.sp[maxLevelIndex];
    } else if (!level) {
      levelReq = skill.levelReq[0];
      spCost = skill.sp[0];
    } else {
      levelReq = skill.levelReq[level];
      spCost = skill.sp[level];
    }

    return {
      levelReq,
      parents,
      spCost,
    };
  },

  description(state, getters, State, Getters) {
    const skill = getters.skillAlt;
    const messages = Getters.messages;

    const level = Math.max(1, getters.level);
    const index = Level.indexOf(level);
    const techCount = getters.techCount;
    const techIndex = index + techCount;

    const descriptionId = skill.description[state.mode][techIndex];

    const str = messages[descriptionId];
    const params = skill.params[state.mode][techIndex];

    return parameterize(str, params, messages);
  },

  nextDescription(state, getters, State, Getters) {
    const skill = getters.skillAlt;
    const messages = Getters.messages;
    const level = getters.level;
    const techCount = getters.techCount;

    if (level > 0 && level < skill.maxLevel) {
      const descriptionId = skill.description[state.mode][level + techCount];
      const str = messages[descriptionId];
      const params = skill.params[state.mode][level + techCount];

      return parameterize(str, params, messages);
    }

    return null;
  },

  crest(state, getters) {
    const crest = state.crests[getters.active];
    if (crest === 0 || crest) {
      return crest;
    }

    return -1;
  },

  crestDescription(state, getters, State, Getters) {
    const messages = Getters.messages;
    const crests = Getters.crests;
    const index = getters.crest;
    const crestCount = getters.crestCount;

    if (index === -1) {
      return crestCount === 7 ? 'Skill Crest Limit Reached' : 'None';
    }

    const crest = crests[getters.active][index];
    return parameterize(messages[crest.description], crest.params, messages);
  },

  crestCount(state) {
    const crests = state.crests;

    return Object.keys(crests)
      .reduce((a, key) => {
        if (crests[key] === -1) {
          return a;
        }
        return a + 1;
      }, 0);
  },

  altSkills(state, getters, State, Getters) {
    const skill = getters.skill;
    const skills = Getters.skills;
    if (!skill.alts) {
      return null;
    }

    return [skill].concat(skill.alts.map(id => skills[id]));
  },

  relatedSkills(state, getters, State, Getters) {
    const skill = getters.skill;
    const skills = Getters.skills;
    if (!skill.related) {
      return null;
    }

    return skill.related.map(id => skills[id]);
  },

  violations(state, getters, State, Getters) {
    const violations = {};
    const levels = state.levels;
    const tree = getters.tree;
    const skills = Getters.skills;
    const spTotals = getters.spTotals;

    const parents = {};
    const conflicts = { group: {}, base: {} };
    const conflictables = ['group', 'base'];
    const ascendancies = {};

    let index = -1;

    for (let i = 0, slot = 0; i < levels.length; i += 1, slot = i % 24) {
      if (slot === 0) {
        index += 1;
      }

      const skill = skills[tree[index][slot]];

      if (skill) {
        const level = Level.valueOf(levels, skill);

        if (level) {
          if (skill.parents) {
            parents[skill.id] = [];
            skill.parents
              .filter(parent => Level.valueOf(levels, skills[parent.id]) < parent.level)
              .forEach(parent => parents[skill.id].push({ ...parent }));
          }

          ascendancies[skill.id] = [];
          skill.ascendancies.forEach((sp, ascendancy) => {
            if (spTotals[ascendancy] < sp) {
              ascendancies[skill.id].push({ ascendancy, sp });
            }
          });

          conflictables.forEach((name) => {
            const value = skill[name];
            if (value) {
              if (!conflicts[name][value]) {
                conflicts[name][value] = [skill.id];
              } else {
                conflicts[name][value].push(skill.id);
              }
            }
          });
        }
      }
    }

    if (conflicts.group[1]) { // there exists ult
      if (conflicts.group[1].length === 2) {
        const [ultA, ultB] = conflicts.group[1];
        if (parents[ultA] || parents[ultB]) {
          delete parents[ultA];
          delete parents[ultB];
        }
      }

      delete conflicts.group[1];
    }

    Object.keys(ascendancies)
      .forEach((id) => {
        if (ascendancies[id].length) {
          violations[id] = { type: 'ascendancy', data: ascendancies[id] };
        }
      });

    Object.keys(parents)
      .forEach((id) => {
        if (!violations[id] && parents[id].length) { // do not add more info than needed
          violations[id] = { type: 'parent', data: parents[id] };
        }
      });

    conflictables.forEach((name) => {
      Object.keys(conflicts[name])
        .forEach((key) => {
          if (conflicts[name][key].length !== 1) {
            const skillId1 = conflicts[name][key][0];
            const skillId2 = conflicts[name][key][1];
            if (skillId1 < skillId2) { // overwrite as this takes priority
              violations[skillId1] = { type: 'conflict', data: skillId2 };
              delete violations[skillId2]; // don't duplicate messages
            }
          }
        });
    });

    return violations;
  },
};
