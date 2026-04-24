import {
  getDaftarKolektor,
  getKolektorBonusList,
  getManualKolektorBonusCandidates,
  getSumberKolektorOptions,
  getUserRoleTable,
} from "@/actions/kolektor"
import { KolektorManagement } from "./kolektor-management"

export default async function KolektorPage() {
  const [kolektorList, bonusList, bonusCandidates, sumberOptions, roleTable] = await Promise.all([
    getDaftarKolektor(),
    getKolektorBonusList(),
    getManualKolektorBonusCandidates(),
    getSumberKolektorOptions(),
    getUserRoleTable(),
  ])

  return (
    <KolektorManagement
      initialKolektor={kolektorList}
      bonusList={bonusList}
      bonusCandidates={bonusCandidates}
      sumberOptions={sumberOptions}
      roleTable={roleTable}
    />
  )
}
