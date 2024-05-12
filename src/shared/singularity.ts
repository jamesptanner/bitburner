import { CityName, GymType, LocationName, Skills, UniversityClassType } from "@ns";
import { Game } from "/lib/game";

export const hasSignularity = function(game: Game): boolean{
  return game.ns.getResetInfo().currentNode == 4 || game.ns.getResetInfo().ownedSF.has(4);
}

type SkillFunc = (location: string,task: string,focus?: boolean | undefined) => boolean

export const trainSkill = async function(game: Game, skill: keyof Skills, target: number) {
  if(game.ns.getPlayer().skills[skill] >= target) return;
  //get location and task to do to improve skill.
  const [city, location, skillFunc, task] = (():[CityName|undefined, LocationName|undefined,SkillFunc|undefined ,GymType|UniversityClassType|undefined] => {
    switch (skill) {
      case "hacking":
        return [game.ns.enums.CityName.Volhaven, game.ns.enums.LocationName.VolhavenZBInstituteOfTechnology,game.ns.singularity.universityCourse, game.ns.enums.UniversityClassType.algorithms];
      case "strength":
        return [game.ns.enums.CityName.Sector12, game.ns.enums.LocationName.Sector12PowerhouseGym,game.ns.singularity.gymWorkout,game.ns.enums.GymType.strength];
      case "defense":
        return [game.ns.enums.CityName.Sector12, game.ns.enums.LocationName.Sector12PowerhouseGym,game.ns.singularity.gymWorkout,game.ns.enums.GymType.defense];
      case "agility":
        return [game.ns.enums.CityName.Sector12, game.ns.enums.LocationName.Sector12PowerhouseGym,game.ns.singularity.gymWorkout,game.ns.enums.GymType.agility];
      case "dexterity":
        return [game.ns.enums.CityName.Sector12, game.ns.enums.LocationName.Sector12PowerhouseGym,game.ns.singularity.gymWorkout,game.ns.enums.GymType.dexterity];
      case "charisma":
        return [game.ns.enums.CityName.Volhaven, game.ns.enums.LocationName.VolhavenZBInstituteOfTechnology,game.ns.singularity.universityCourse, game.ns.enums.UniversityClassType.leadership];
    }
    return [undefined,undefined,undefined,undefined];
  })();
  if(city && location && task && skillFunc){
    game.logging.info(`Training in ${skill} at ${location} ${game.ns.getPlayer().skills[skill]}/${target}`);
    if (game.ns.getPlayer().city !== city){
      while (! game.ns.singularity.travelToCity(city) && game.ns.getPlayer().city !== city){
        await game.ns.asleep(10000);
      }
    } 
    skillFunc(location, task,false);
     
    let lastSkillLevel = 0;
    while (game.ns.getPlayer().skills[skill] < target) {
      if(lastSkillLevel < game.ns.getPlayer().skills[skill] ){
        lastSkillLevel = game.ns.getPlayer().skills[skill]
        game.logging.info(`${skill} ${game.ns.getPlayer().skills[skill]}/${target}`)
        game.ns.setTitle(`Training ${skill} at ${location}: (${game.ns.getPlayer().skills[skill]}/${target})`);
      }
      await game.ns.asleep(5000);
    }
    game.ns.singularity.stopAction()

  }
}