import { BackdoorRequirement, BitNodeRequirement, CityRequirement, CompanyName, CompanyReputationRequirement, EmployedByRequirement, EveryRequirement, GymType, HacknetCoresRequirement, HacknetLevelsRequirement, HacknetRAMRequirement, JobTitleRequirement, KarmaRequiremennt, MoneyRequirement, NS, NotRequirement, NumAugmentationsRequirement, PeopleKilledRequirement, PlayerRequirement, SkillRequirement, Skills, SomeRequirement, SourceFileRequirement } from "@ns";
import { Logging } from "/shared/logging";
import { FindValidMathExpressions } from "/contracts/solvers/StringContracts";

export const enum ProcessRequirementsResult {
  Forfilled,
  Possible,
  Impossible
}

abstract class RequirementHandler<T extends PlayerRequirement> {

  protected async trainGymSkill(ns: NS, logging: Logging, skill: GymType, target: number, skillName: keyof Skills) {
    if(ns.getPlayer().skills[skillName] >= target) return;
    logging.info(`Training in ${skillName} at ${ns.enums.LocationName.Sector12PowerhouseGym} ${ns.getPlayer().skills[skillName]}/${target}`);
    if (ns.getPlayer().location !== ns.enums.CityName.Sector12){
      while (! ns.singularity.travelToCity(ns.enums.CityName.Sector12) && ns.getPlayer().location !== ns.enums.CityName.Sector12){
        await ns.asleep(10000);
      }
    } 
    ns.singularity.gymWorkout(ns.enums.LocationName.Sector12PowerhouseGym, skill,false)
    let lastSkillLevel = 0;
    while (ns.getPlayer().skills[skillName] < target) {
      if(lastSkillLevel < ns.getPlayer().skills[skillName] ){
        lastSkillLevel = ns.getPlayer().skills[skillName]
        logging.info(`${skillName} ${ns.getPlayer().skills[skillName]}/${target}`)
      }
      await ns.asleep(5000);
    }
    ns.singularity.stopAction()
  }

  protected async trainUniSkill(ns: NS, logging: Logging, skill: string, target: number, skillName: keyof Skills) {
    if(ns.getPlayer().skills[skillName] >= target) return;
    logging.info(`Training in ${skillName} at ${ns.enums.LocationName.VolhavenZBInstituteOfTechnology} ${ns.getPlayer().skills[skillName]}/${target}`);
    if (ns.getPlayer().location !== ns.enums.CityName.Volhaven){
      while (! ns.singularity.travelToCity(ns.enums.CityName.Volhaven) && ns.getPlayer().location !== ns.enums.CityName.Volhaven){
        await ns.asleep(10000);
      }
    } 
    ns.singularity.universityCourse(ns.enums.LocationName.VolhavenZBInstituteOfTechnology, skill,false)
    let lastSkillLevel = 0;
    while (ns.getPlayer().skills[skillName] < target) {
      if(lastSkillLevel < ns.getPlayer().skills[skillName] ){
        lastSkillLevel = ns.getPlayer().skills[skillName]
        logging.info(`${skillName} ${ns.getPlayer().skills[skillName]}/${target}`)
      }
      await ns.asleep(5000);
    }
    ns.singularity.stopAction()
  }

  protected canReverse(ns: NS, logging: Logging, requirement: PlayerRequirement): boolean {
    return false
  }

  protected reverse(ns: NS, logging: Logging, requirement: PlayerRequirement): ProcessRequirementsResult {
    return ProcessRequirementsResult.Impossible
  }

  abstract check(ns: NS, logging: Logging, requirement: T): ProcessRequirementsResult;
  abstract do(ns: NS, logging: Logging, requirement: T): Promise<ProcessRequirementsResult>
}

const requirementProcessors = new Map<PlayerRequirement["type"], RequirementHandler<any>>();
class MoneyRequirementHandler extends RequirementHandler<MoneyRequirement> {
  check(ns: NS, logging: Logging, requirement: MoneyRequirement): ProcessRequirementsResult {
    return ns.getPlayer().money >= requirement.money ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: MoneyRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Waiting until we have $${requirement.money}`)
    while (this.check(ns, logging, requirement)) {
      await ns.asleep(5000);
    }
    return ProcessRequirementsResult.Forfilled
  }
}
requirementProcessors.set("money", new MoneyRequirementHandler());

class SkillRequirementHandler extends RequirementHandler<SkillRequirement> {
  check(ns: NS, logging: Logging, requirement: SkillRequirement): ProcessRequirementsResult {
    const playerInfo = ns.getPlayer();
    return (playerInfo.skills.agility >= (requirement.skills.agility ?? 0)) &&
      (playerInfo.skills.charisma >= (requirement.skills.charisma ?? 0)) &&
      (playerInfo.skills.defense >= (requirement.skills.defense ?? 0)) &&
      (playerInfo.skills.dexterity >= (requirement.skills.dexterity ?? 0)) &&
      (playerInfo.skills.hacking >= (requirement.skills.hacking ?? 0)) &&
      (playerInfo.skills.strength >= (requirement.skills.strength ?? 0))
      ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }

  async do(ns: NS, logging: Logging, requirement: SkillRequirement): Promise<ProcessRequirementsResult> {
    if (requirement.skills.agility) await this.trainGymSkill(ns, logging, ns.enums.GymType.agility, requirement.skills.agility, "agility");
    if (requirement.skills.defense) await this.trainGymSkill(ns, logging, ns.enums.GymType.defense, requirement.skills.defense, "defense");
    if (requirement.skills.dexterity) await this.trainGymSkill(ns, logging, ns.enums.GymType.dexterity, requirement.skills.dexterity, "dexterity");
    if (requirement.skills.strength) await this.trainGymSkill(ns, logging, ns.enums.GymType.strength, requirement.skills.strength, "strength");

    if (requirement.skills.hacking) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.algorithms, requirement.skills.hacking, "hacking");
    if (requirement.skills.charisma) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.leadership, requirement.skills.charisma, "charisma");
    return ProcessRequirementsResult.Forfilled;
  }
}
requirementProcessors.set("skills", new SkillRequirementHandler());

class KarmaRequirementHandler extends RequirementHandler<KarmaRequiremennt> {
  check(ns: NS, logging: Logging, requirement: KarmaRequiremennt): ProcessRequirementsResult {
    return ns.getPlayer().karma <= requirement.karma ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: KarmaRequiremennt): Promise<ProcessRequirementsResult> {
    logging.info(`Committing crime to lower karam to ${requirement.karma}`)
    while (ns.getPlayer().karma > requirement.karma) {
      const timeToWait = ns.singularity.commitCrime("Homicide");
      await ns.asleep(timeToWait);
    }
    return ProcessRequirementsResult.Forfilled
  }

}
requirementProcessors.set("karma", new KarmaRequirementHandler());

class PeopleKilledRequirementHandler extends RequirementHandler<PeopleKilledRequirement> {
  check(ns: NS, logging: Logging, requirement: PeopleKilledRequirement): ProcessRequirementsResult {
    return (ns.getPlayer().numPeopleKilled >= requirement.numPeopleKilled) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: PeopleKilledRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Committing homicide to reach comitting ${requirement.numPeopleKilled} murders`)
    while (ns.getPlayer().numPeopleKilled > requirement.numPeopleKilled) {
      const timeToWait = ns.singularity.commitCrime("Homicide");
      await ns.asleep(timeToWait);
    }
    return ProcessRequirementsResult.Forfilled
  }

}
requirementProcessors.set("numPeopleKilled", new PeopleKilledRequirementHandler());

class AugmentsRequirementHandler extends RequirementHandler<NumAugmentationsRequirement> {
  check(ns: NS, logging: Logging, requirement: NumAugmentationsRequirement): ProcessRequirementsResult {
    return ns.singularity.getOwnedAugmentations(false).length >= requirement.numAugmentations ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: NumAugmentationsRequirement): Promise<ProcessRequirementsResult> {
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("numAugmentations", new AugmentsRequirementHandler());

class EmployedByRequirementHandler extends RequirementHandler<EmployedByRequirement> {
  check(ns: NS, logging: Logging, requirement: EmployedByRequirement): ProcessRequirementsResult {
    return (ns.getPlayer().jobs[requirement.company] ?? false) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: EmployedByRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Applying for job at ${requirement.company}`)
    if (ns.getPlayer().jobs[requirement.company]) return ProcessRequirementsResult.Forfilled;
    ns.singularity.applyToCompany(requirement.company, ns.enums.JobField.software)
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("employedBy", new EmployedByRequirementHandler());

class CompanyReputationRequirementHandler extends RequirementHandler<CompanyReputationRequirement> {
  check(ns: NS, logging: Logging, requirement: CompanyReputationRequirement): ProcessRequirementsResult {
    return ns.singularity.getCompanyRep(requirement.company) >= requirement.reputation ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible
  }
  async do(ns: NS, logging: Logging, requirement: CompanyReputationRequirement): Promise<ProcessRequirementsResult> {
    //find if we have a job with the company already.
    let currentJob = ns.getPlayer().jobs[requirement.company]
    if (currentJob === undefined){
      logging.info(`No job with ${requirement.company} currently. Going for employment.`);
      const positions = ns.singularity.getCompanyPositions(requirement.company);
      if (positions.find(jobName =>{return jobName === ns.enums.JobName.software0})){
        ns.singularity.applyToCompany(requirement.company,ns.enums.JobField.software);
      }
      currentJob = ns.getPlayer().jobs[requirement.company];
    }
    if (currentJob === undefined) return ProcessRequirementsResult.Possible
    ns.singularity.workForCompany(requirement.company,false)

    while(this.check(ns,logging,requirement) !== ProcessRequirementsResult.Forfilled){
      const currentJobInfo = ns.singularity.getCompanyPositionInfo(requirement.company,currentJob) ;
      const nextJob = ns.singularity.getCompanyPositionInfo(requirement.company,currentJobInfo.nextPosition!);
      if(ns.singularity.getCompanyRep(requirement.company) >= nextJob.requiredReputation ){
        // train for next promotion

        if (nextJob.requiredSkills.agility) await this.trainGymSkill(ns, logging, ns.enums.GymType.agility, nextJob.requiredSkills.agility, "agility");
        if (nextJob.requiredSkills.defense) await this.trainGymSkill(ns, logging, ns.enums.GymType.defense, nextJob.requiredSkills.defense, "defense");
        if (nextJob.requiredSkills.dexterity) await this.trainGymSkill(ns, logging, ns.enums.GymType.dexterity, nextJob.requiredSkills.dexterity, "dexterity");
        if (nextJob.requiredSkills.strength) await this.trainGymSkill(ns, logging, ns.enums.GymType.strength, nextJob.requiredSkills.strength, "strength");

        if (nextJob.requiredSkills.hacking) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.algorithms, nextJob.requiredSkills.hacking, "hacking");
        if (nextJob.requiredSkills.charisma) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.leadership, nextJob.requiredSkills.charisma, "charisma");
        ns.singularity.applyToCompany(requirement.company,ns.enums.JobField.software);
        ns.singularity.workForCompany(requirement.company,false);
      }

      await ns.asleep(5000);
    }
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("companyReputation", new CompanyReputationRequirementHandler());

class JobTitleRequirementHandler extends RequirementHandler<JobTitleRequirement> {
  check(ns: NS, logging: Logging, requirement: JobTitleRequirement): ProcessRequirementsResult {
    const jobs = ns.getPlayer().jobs;
    for (const jobKey in jobs) {
      if (jobKey === requirement.jobTitle) return ProcessRequirementsResult.Forfilled
    }
    return ProcessRequirementsResult.Possible;

  }
  async do(ns: NS, logging: Logging, requirement: JobTitleRequirement): Promise<ProcessRequirementsResult> {
    // find a company that provides the postition
    const company =  Object.keys(ns.enums.CompanyName).find((company) =>{
      return ns.singularity.getCompanyPositions(company as CompanyName).some(job => job === requirement.jobTitle)
    }) as CompanyName;
    const targetRole = ns.singularity.getCompanyPositionInfo(company,requirement.jobTitle)

    ns.singularity.applyToCompany(company,targetRole.field);
    ns.singularity.workForCompany(company,false);

    while(this.check(ns,logging,requirement) !== ProcessRequirementsResult.Forfilled){
      const currentJob = ns.getPlayer().jobs[company]
      if (currentJob === undefined) return ProcessRequirementsResult.Possible;
      const currentJobInfo = ns.singularity.getCompanyPositionInfo(company,currentJob)
      if (currentJobInfo === null) return ProcessRequirementsResult.Possible
      const nextJob = ns.singularity.getCompanyPositionInfo(company,currentJobInfo.nextPosition!);
      if(ns.singularity.getCompanyRep(company) >= nextJob.requiredReputation ){
        // train for next promotion
        ns.singularity.stopAction()
        if (nextJob.requiredSkills.agility) await this.trainGymSkill(ns, logging, ns.enums.GymType.agility, nextJob.requiredSkills.agility, "agility");
        if (nextJob.requiredSkills.defense) await this.trainGymSkill(ns, logging, ns.enums.GymType.defense, nextJob.requiredSkills.defense, "defense");
        if (nextJob.requiredSkills.dexterity) await this.trainGymSkill(ns, logging, ns.enums.GymType.dexterity, nextJob.requiredSkills.dexterity, "dexterity");
        if (nextJob.requiredSkills.strength) await this.trainGymSkill(ns, logging, ns.enums.GymType.strength, nextJob.requiredSkills.strength, "strength");

        if (nextJob.requiredSkills.hacking) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.algorithms, nextJob.requiredSkills.hacking, "hacking");
        if (nextJob.requiredSkills.charisma) await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.leadership, nextJob.requiredSkills.charisma, "charisma");
        ns.singularity.applyToCompany(company,targetRole.field);
        ns.singularity.workForCompany(company,false);
      }

      await ns.asleep(10000);
    }
    //find what we need for the postition
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("jobTitle", new JobTitleRequirementHandler());

class CityRequirementHandler extends RequirementHandler<CityRequirement> {
  check(ns: NS, logging: Logging, requirement: CityRequirement): ProcessRequirementsResult {
    return ns.getPlayer().city === requirement.city ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: CityRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Travelling to ${requirement.city}`)
    ns.singularity.travelToCity(requirement.city);
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("city", new CityRequirementHandler());

class BackdoorRequirementHandler extends RequirementHandler<BackdoorRequirement> {
  check(ns: NS, logging: Logging, requirement: BackdoorRequirement): ProcessRequirementsResult {
    return ns.getServer(requirement.server).backdoorInstalled ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: BackdoorRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Waiting for backdoor to ${requirement.server}`)
    const hackingNeeded = ns.getServer(requirement.server).requiredHackingSkill
    if (hackingNeeded !== undefined && hackingNeeded > ns.getPlayer().skills.hacking) {
      logging.info(`Not skilled enough to install backdoor (${ns.getPlayer().skills.hacking}/${hackingNeeded})`)
      await this.trainUniSkill(ns, logging, ns.enums.UniversityClassType.algorithms, hackingNeeded, "hacking")
    }

    while (this.check(ns, logging, requirement) !== ProcessRequirementsResult.Forfilled) {
      logging.info(`Waiting for background jobs to backdoor ${requirement.server}`)
      await ns.asleep(10000);
    }
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("backdoorInstalled", new BackdoorRequirementHandler())

class HacknetRAMRequirementHandler extends RequirementHandler<HacknetRAMRequirement> {
  check(ns: NS, logging: Logging, requirement: HacknetRAMRequirement): ProcessRequirementsResult {
    let total = 0
    for (let index = 0; index < ns.hacknet.numNodes(); index++) {
      const node = ns.hacknet.getNodeStats(index);
      total += node.ram;
    }

    return (total >= requirement.hacknetRAM) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: HacknetRAMRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Purchasing Ram for hacknet nodes`);
    while (this.check(ns, logging, requirement) !== ProcessRequirementsResult.Forfilled) {
      for (let index = 0; index < ns.hacknet.numNodes(); index++) {
        const cost = ns.hacknet.getRamUpgradeCost(index)
        if (cost < ns.getPlayer().money) ns.hacknet.upgradeRam(index, 1);
        if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      }
      if (ns.hacknet.getPurchaseNodeCost() < ns.getPlayer().money) ns.hacknet.purchaseNode();
      if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      logging.info(`Not enough RAM yet. Sleeping for 10 seconds and going again.`)
      await ns.asleep(10000);
    }
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("hacknetRAM", new HacknetRAMRequirementHandler());

class HacknetCoresRequirementHandler extends RequirementHandler<HacknetCoresRequirement> {
  check(ns: NS, logging: Logging, requirement: HacknetCoresRequirement): ProcessRequirementsResult {
    let total = 0
    for (let index = 0; index < ns.hacknet.numNodes(); index++) {
      const node = ns.hacknet.getNodeStats(index);
      total += node.cores;
    }

    return (total >= requirement.hacknetCores) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: HacknetCoresRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Purchasing Ram for hacknet nodes`);
    while (this.check(ns, logging, requirement) !== ProcessRequirementsResult.Forfilled) {
      for (let index = 0; index < ns.hacknet.numNodes(); index++) {
        const cost = ns.hacknet.getCoreUpgradeCost(index)
        if (cost < ns.getPlayer().money) ns.hacknet.upgradeCore(index, 1);
        if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      }
      if (ns.hacknet.getPurchaseNodeCost() < ns.getPlayer().money) ns.hacknet.purchaseNode();
      if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      logging.info(`Not enough Cores yet. Sleeping for 10 seconds and going again.`)
      await ns.asleep(10000);
    }
    return ProcessRequirementsResult.Forfilled;
  }
}
requirementProcessors.set("hacknetCores", new HacknetCoresRequirementHandler());

class HacknetLevelRequirementHandler extends RequirementHandler<HacknetLevelsRequirement> {
  check(ns: NS, logging: Logging, requirement: HacknetLevelsRequirement): ProcessRequirementsResult {
    let total = 0
    for (let index = 0; index < ns.hacknet.numNodes(); index++) {
      const node = ns.hacknet.getNodeStats(index);
      total += node.level;
    }

    return (total >= requirement.hacknetLevels) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Possible;
  }
  async do(ns: NS, logging: Logging, requirement: HacknetLevelsRequirement): Promise<ProcessRequirementsResult> {
    logging.info(`Purchasing Levels for hacknet nodes`);
    while (this.check(ns, logging, requirement) !== ProcessRequirementsResult.Forfilled) {
      for (let index = 0; index < ns.hacknet.numNodes(); index++) {
        const cost = ns.hacknet.getLevelUpgradeCost(index)
        if (cost < ns.getPlayer().money) ns.hacknet.upgradeLevel(index, 1);
        if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      }
      if (ns.hacknet.getPurchaseNodeCost() < ns.getPlayer().money) ns.hacknet.purchaseNode();
      if (this.check(ns, logging, requirement)) return ProcessRequirementsResult.Forfilled;
      logging.info(`Not enough levels yet. Sleeping for 10 seconds and going again.`)
      await ns.asleep(10000);
    }
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("hacknetLevels", new HacknetLevelRequirementHandler());


class BitNodeRequirementHandler extends RequirementHandler<BitNodeRequirement> {
  check(ns: NS, logging: Logging, requirement: BitNodeRequirement): ProcessRequirementsResult {
    return ns.getResetInfo().currentNode === requirement.bitNodeN ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: BitNodeRequirement): Promise<ProcessRequirementsResult> {
    return ProcessRequirementsResult.Forfilled;
  }

}
requirementProcessors.set("bitNodeN", new BitNodeRequirementHandler());

class SourceFileRequirementHandler extends RequirementHandler<SourceFileRequirement> {
  check(ns: NS, logging: Logging, requirement: SourceFileRequirement): ProcessRequirementsResult {
    return ns.getResetInfo().ownedSF.has(requirement.sourceFile) ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: SourceFileRequirement): Promise<ProcessRequirementsResult> {
    return ProcessRequirementsResult.Forfilled
  }

}
requirementProcessors.set("sourceFile", new SourceFileRequirementHandler());

class NotRequirementHandler extends RequirementHandler<NotRequirement> {
  check(ns: NS, logging: Logging, requirement: NotRequirement): ProcessRequirementsResult {
    if (!requirementProcessors.has(requirement.condition.type)) {
      logging.warning(`Unable to process ${requirement.condition.type} requirement.`, true);
      return ProcessRequirementsResult.Impossible;
    }
    return requirementProcessors.get(requirement.condition.type)?.check(ns, logging, requirement.condition) !== ProcessRequirementsResult.Forfilled ? ProcessRequirementsResult.Forfilled : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: NotRequirement): Promise<ProcessRequirementsResult> {
    return ProcessRequirementsResult.Forfilled
  }

}
requirementProcessors.set("not", new NotRequirementHandler());

class SomeRequirementHandler extends RequirementHandler<SomeRequirement> {
  check(ns: NS, logging: Logging, requirement: SomeRequirement): ProcessRequirementsResult {
    return requirement.conditions.find(nestedReq => {
      if (!requirementProcessors.has(nestedReq.type)) {
        logging.warning(`Unable to process ${nestedReq.type} requirement.`, true);
        return false;
      }
      if (requirementProcessors.has(nestedReq.type)) {
        return requirementProcessors.get(nestedReq.type)?.check(ns, logging, nestedReq) !== ProcessRequirementsResult.Impossible;
      }
      return false;
    }) ? ProcessRequirementsResult.Possible : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: SomeRequirement): Promise<ProcessRequirementsResult> {
    var state = ProcessRequirementsResult.Possible;
    for (let index = 0; index < requirement.conditions.length && state !== ProcessRequirementsResult.Forfilled; index++) {
      const nestedReq = requirement.conditions[index];
      if (!requirementProcessors.has(nestedReq.type)) {
        logging.warning(`Unable to process ${nestedReq.type} requirement.`, true);
        continue;
      }
      const returnedState = await requirementProcessors.get(nestedReq.type)?.do(ns, logging, nestedReq);
      if (returnedState === ProcessRequirementsResult.Forfilled) {
        state = returnedState;
      }
    }
    return state;
  }

}
requirementProcessors.set("someCondition", new SomeRequirementHandler());

class EveryRequirementHandler extends RequirementHandler<EveryRequirement> {
  check(ns: NS, logging: Logging, requirement: EveryRequirement): ProcessRequirementsResult {
    return requirement.conditions.every(nestedReq => {
      if (!requirementProcessors.has(nestedReq.type)) {
        logging.warning(`Unable to process ${nestedReq.type} requirement.`, true);
        return false;
      }
      if (requirementProcessors.has(nestedReq.type)) {
        return requirementProcessors.get(nestedReq.type)?.check(ns, logging, nestedReq) !== ProcessRequirementsResult.Impossible;
      }
      return false;
    }) ? ProcessRequirementsResult.Possible : ProcessRequirementsResult.Impossible;
  }
  async do(ns: NS, logging: Logging, requirement: EveryRequirement): Promise<ProcessRequirementsResult> {
    var state = ProcessRequirementsResult.Forfilled;
    for (let index = 0; index < requirement.conditions.length && state === ProcessRequirementsResult.Forfilled; index++) {
      const nestedReq = requirement.conditions[index];
      if (!requirementProcessors.has(nestedReq.type)) {
        logging.warning(`Unable to process ${nestedReq.type} requirement.`, true);
        continue;
      }
      const returnedState = await requirementProcessors.get(nestedReq.type)?.do(ns, logging, nestedReq);
      if (returnedState !== undefined && returnedState !== ProcessRequirementsResult.Forfilled) {
        state = returnedState;
      }
    }
    return state;
  }

}
requirementProcessors.set("everyCondition", new EveryRequirementHandler());



export const processRequirements = async function (ns: NS, logging: Logging, requirements: PlayerRequirement[]): Promise<ProcessRequirementsResult> {
  //give 5 attempts before failing if left unforfilled.
  for (let attempt = 0; attempt < 5; attempt++) {    
    let currentState = ProcessRequirementsResult.Forfilled;
    requirementList: for (let index = 0; index < requirements.length; index++) {
      const requirement = requirements[index];
      if (!requirementProcessors.has(requirement.type)) {
        return ProcessRequirementsResult.Impossible
      }
      const checkState = requirementProcessors.get(requirement.type)!.check(ns, logging, requirement);
      switch(checkState){
        case ProcessRequirementsResult.Forfilled:
          continue requirementList;
        case ProcessRequirementsResult.Possible:
          const lastState = await requirementProcessors.get(requirement.type)!.do(ns, logging, requirement);
          if (lastState === ProcessRequirementsResult.Impossible) return ProcessRequirementsResult.Impossible;
          currentState = lastState;
          break;
        case ProcessRequirementsResult.Impossible:
          return checkState;
      }
    }
    if (currentState === ProcessRequirementsResult.Forfilled) return ProcessRequirementsResult.Forfilled;
  }
  return ProcessRequirementsResult.Impossible;
}