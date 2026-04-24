import {
  getDaftarKolektor,
  getKolektorBonusList,
  getSumberKolektorOptions,
  getUserRoleTable,
} from "@/actions/kolektor"
import { KolektorManagement } from "./kolektor-management"

export default async function KolektorPage() {
  const [kolektorList, bonusList, sumberOptions, roleTable] = await Promise.all([
    getDaftarKolektor(),
    getKolektorBonusList(),
    getSumberKolektorOptions(),
    getUserRoleTable(),
  ])

  return (
    <KolektorManagement
      initialKolektor={kolektorList}
      bonusList={bonusList}
      sumberOptions={sumberOptions}
      roleTable={roleTable}
    />
  )
}
