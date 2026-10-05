import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { SectionHeading } from './SectionHeading'
import { tokens } from './tokens'

const faqs = [
  {
    q: 'What is Toonwide?',
    a: 'A Windows app that listens to your calls and gives you real-time answers, notes from your screen, and a shareable room for your team.'
  },
  {
    q: 'Is Toonwide free?',
    a: 'Yes, to start. Every new account gets 60 free minutes, valid for 7 days. Larger minute packs are coming soon.'
  },
  {
    q: 'How do sessions work?',
    a: 'Log in on the website and click Start session. The app opens and works for up to 60 minutes, and only the minutes you use are counted.'
  },
  {
    q: 'Does Toonwide join my meeting?',
    a: 'No. It runs on your PC and listens to your audio. Nothing is added to the meeting.'
  },
  {
    q: 'What happens to my data?',
    a: 'Your chat history is saved to your account for 90 days so you can review it, and you can turn saving off or delete it at any time.'
  },
  {
    q: 'Which platforms are supported?',
    a: 'Windows today. It works alongside Zoom, Microsoft Teams, Google Meet, Webex and other call apps.'
  }
]

export function Faq() {
  return (
    <Box component="section" id="faq" aria-labelledby="faq-title" sx={{ scrollMarginTop: '24px' }}>
      <Box className="container" sx={{ py: { xs: 10, md: 16 }, pt: { xs: 0, md: 0 } }}>
        <div className="row g-4">
          <div className="col-lg-4">
            <SectionHeading titleId="faq-title" title="Frequently asked questions" align="left" />
          </div>
          <div className="col-lg-8">
            <Box sx={{ borderTop: '1px solid #e6e8ee' }}>
              {faqs.map((f, i) => (
                <Accordion
                  key={f.q}
                  disableGutters
                  elevation={0}
                  square
                  sx={{
                    background: 'transparent',
                    borderBottom: '1px solid #e6e8ee',
                    '&::before': { display: 'none' }
                  }}
                >
                  <AccordionSummary
                    id={`faq-q-${i}`}
                    aria-controls={`faq-a-${i}`}
                    expandIcon={<ExpandMore sx={{ color: tokens.ink }} />}
                    sx={{
                      px: 0,
                      py: { xs: 1.5, md: 2 },
                      '& .MuiAccordionSummary-content': { my: 0, pr: 2 },
                      '&.Mui-focusVisible': { background: 'rgba(31,99,230,.06)', borderRadius: '8px' }
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: { xs: 19, md: 22 }, fontWeight: 500, letterSpacing: '-0.3px', color: tokens.ink }}>
                      {f.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 3 }}>
                    <Typography sx={{ color: 'text.secondary', maxWidth: 680 }}>{f.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </div>
        </div>
      </Box>
    </Box>
  )
}
