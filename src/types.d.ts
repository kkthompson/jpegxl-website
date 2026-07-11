// Non-standard attributes used in our markup that Astro's HTML types don't know about.
declare namespace astroHTML.JSX {
  interface InputHTMLAttributes {
    /** Legacy Firefox (<120) vertical range slider; modern browsers use the
     * `writing-mode: vertical-lr` rule in DistanceVSEffort.css instead. */
    orient?: 'horizontal' | 'vertical';
  }
}
