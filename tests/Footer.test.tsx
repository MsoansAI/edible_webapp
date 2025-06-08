import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Footer from '@/components/Footer'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('Footer Component', () => {
  beforeEach(() => {
    render(<Footer />)
  })

  it('renders the main footer sections', () => {
    // Check main heading
    expect(screen.getByText('Edible Arrangements')).toBeInTheDocument()
    
    // Check section headings
    expect(screen.getByText('Our Products')).toBeInTheDocument()
    expect(screen.getByText('Customer Service')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Connect With Us')).toBeInTheDocument()
  })

  it('displays newsletter signup section', () => {
    expect(screen.getByText('Stay Fresh with Our Newsletter')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument()
  })

  it('shows contact information', () => {
    expect(screen.getByText('1-800-EDIBLES (1-800-334-2537)')).toBeInTheDocument()
    expect(screen.getByText('support@ediblearrangements.com')).toBeInTheDocument()
    expect(screen.getByText(/95 Barnes Road/)).toBeInTheDocument()
  })

  it('displays business hours', () => {
    expect(screen.getByText('Customer Support Hours')).toBeInTheDocument()
    expect(screen.getByText('Mon - Fri:')).toBeInTheDocument()
    expect(screen.getByText('7AM - 12AM ET')).toBeInTheDocument()
  })

  it('shows payment methods', () => {
    expect(screen.getByText('We Accept')).toBeInTheDocument()
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText('Mastercard')).toBeInTheDocument()
    expect(screen.getByText('PayPal')).toBeInTheDocument()
  })

  it('displays security badges', () => {
    expect(screen.getByText('SSL Secured')).toBeInTheDocument()
    expect(screen.getByText('PCI Compliant')).toBeInTheDocument()
  })

  it('shows quality certifications', () => {
    expect(screen.getByText('Quality & Safety')).toBeInTheDocument()
    expect(screen.getByText('HACCP Certified')).toBeInTheDocument()
    expect(screen.getByText('FDA Registered')).toBeInTheDocument()
    expect(screen.getByText('100% Fresh Guarantee')).toBeInTheDocument()
  })

  it('has international selectors', () => {
    expect(screen.getByText('Country/Region')).toBeInTheDocument()
    expect(screen.getByText('Currency')).toBeInTheDocument()
    
    // Check for select elements
    const countrySelect = screen.getByLabelText('Country/Region')
    const currencySelect = screen.getByLabelText('Currency')
    expect(countrySelect).toBeInTheDocument()
    expect(currencySelect).toBeInTheDocument()
  })

  it('displays mobile app download options', () => {
    expect(screen.getByText('Download Our App')).toBeInTheDocument()
    expect(screen.getByText('App Store')).toBeInTheDocument()
    expect(screen.getByText('Google Play')).toBeInTheDocument()
  })

  it('shows copyright and legal links', () => {
    expect(screen.getByText(/© 2024 Edible Arrangements, LLC/)).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('handles newsletter form submission', () => {
    const emailInput = screen.getByPlaceholderText('Enter your email address')
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(subscribeButton)

    expect(screen.getByText('Thank you for subscribing!')).toBeInTheDocument()
  })

  it('allows country selection change', () => {
    const countrySelect = screen.getByLabelText('Country/Region')
    
    fireEvent.change(countrySelect, { target: { value: 'CA' } })
    
    expect(countrySelect).toHaveValue('CA')
  })

  it('allows currency selection change', () => {
    const currencySelect = screen.getByLabelText('Currency')
    
    fireEvent.change(currencySelect, { target: { value: 'EUR' } })
    
    expect(currencySelect).toHaveValue('EUR')
  })

  it('has proper navigation links', () => {
    // Test a few key navigation links
    const aboutLink = screen.getByRole('link', { name: 'About Us' })
    const helpLink = screen.getByRole('link', { name: 'Help Center' })
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' })

    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(helpLink).toHaveAttribute('href', '/help')
    expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  it('has social media links with proper attributes', () => {
    const socialLinks = screen.getAllByRole('link', { name: /facebook|instagram|twitter|pinterest|youtube/i })
    
    socialLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.getAttribute('href')).toContain('ediblearrangements')
    })
  })
}) 