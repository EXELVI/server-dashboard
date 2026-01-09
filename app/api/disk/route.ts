import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const disk = url.searchParams.get('disk') || ''

  return new Promise((resolve) => {
    exec(`df -h /${disk}`, (err, stdout) => {
      if (err) {
        resolve(
          NextResponse.json({ error: err.message }, { status: 500 })
        )
        return
      }

      const lines = stdout.trim().split('\n')
      const data = lines[1].split(/\s+/)

      let filesystem = data[0]
      const size = data[1]
      const used = data[2]
      const avail = data[3]
      const usePercent = data[4]
      const mountPoint = data[5]

      
      if (!disk) {
        filesystem = '/dev/sdb3'
      }
   exec(`timeout 2s dd if=${filesystem} of=/dev/null bs=1M count=1 status=none`, (ioErr) => {
        const ioStatus = ioErr ? 'ERROR' : 'OK'
      exec(`smartctl -H ${filesystem}`, (smartErr, smartOut) => { 
        let health = 'UNKNOWN'

        if (!smartErr && smartOut.includes('PASSED')) {
          health = 'GOOD'
        } else if (!smartErr) {
          health = 'BAD'
        }

        resolve(
          NextResponse.json({
            filesystem,
            mountPoint,
            size,
            used,
            avail,
            usePercent,
            ioStatus: ioStatus,
            health
         })
          )
        })
      })
    })
  })
}