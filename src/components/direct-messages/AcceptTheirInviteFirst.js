import { Box, Button, Typography } from '@mui/material'
import React from 'react'
import acceptLogo from './../../assets/acceptInvite.png'
import TittleDm from './TitleDM'

function AcceptTheirInviteFirst({
  title
}) {
  return (
    <div className='h-full'><TittleDm title={title}/>
    <Box
    className='flex justify-center items-center flex-col h-[98%]'
    >
      
        <div className='grow'/>
        <img src={acceptLogo} alt=""/>
        <Typography fontSize={"24px"} fontWeight={700} color={"#323232"}  maxWidth={"400px"} textAlign="center">
        Please accept the invite to message {title}
        </Typography>
        <Button
        sx={{
          background: "#3884F7",
          color: 'white'
        }}
        className='bg-[#3884F7] text-white py-4 px-[34px] text-base my-3 hover:text-[#3884F7] hover:bg-[#EBF3FF]'
        > 
            Accept
        </Button>
        <div className='grow'/>

        
        
    </Box>
    </div>
  )
}

export default AcceptTheirInviteFirst